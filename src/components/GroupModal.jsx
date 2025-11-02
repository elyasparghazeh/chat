import React, { useState, useEffect } from "react";

export default function GroupModal({ isOpen, onClose,setActiveChat,  token }) {
    const [groupName, setGroupName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // 🔍 جستجوی کاربران
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const controller = new AbortController();

        const fetchUsers = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_BASE_URL}/api/users/search?query=${encodeURIComponent(searchTerm)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal,
                    }
                );
                const data = await res.json();
                setSearchResults(data.data || []);
            } catch (err) {
                if (err.name !== "AbortError") console.error(err);
            }
        };

        fetchUsers();
        return () => controller.abort();
    }, [searchTerm, token]);

    // ✅ انتخاب کاربر
    const toggleUser = (user) => {
        setSelectedUsers((prev) =>
            prev.some((u) => u._id === user._id)
                ? prev.filter((u) => u._id !== user._id)
                : [...prev, user]
        );
    };

    // ✅ ارسال درخواست ساخت گروه
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return alert("نام گروه و اعضا را وارد کنید!");

        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/group/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: groupName,
                    participants: selectedUsers.map((u) => u._id),
                }),
            });

            const data = await res.json();

            if (data.success) {
                setActiveChat(data)
                onClose();
                setGroupName("");
                setSelectedUsers([]);
                setSearchTerm("");
            } else {
                alert("ساخت گروه ناموفق بود!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
                <h2 className="text-lg font-bold mb-4">👥 ساخت گروه جدید</h2>

                {/* نام گروه */}
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="نام گروه..."
                    className="w-full border rounded-xl p-2 mb-4 focus:outline-none focus:ring focus:ring-blue-200"
                />

                {/* سرچ کاربران */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجو کاربران..."
                        className="w-full border rounded-xl p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />

                    {searchResults.length > 0 && (
                        <div className=" top-12 left-0 right-0 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                            {searchResults.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => toggleUser(user)}
                                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                                        selectedUsers.some((u) => u._id === user._id)
                                            ? "bg-blue-100"
                                            : ""
                                    }`}
                                >
                                    {user.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* نمایش کاربران انتخاب‌شده */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedUsers.map((user) => (
                        <span
                            key={user._id}
                            className="bg-blue-500 text-white text-sm px-2 py-1 rounded-xl"
                        >
              {user.name}
            </span>
                    ))}
                </div>

                {/* دکمه‌ها */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                    >
                        لغو
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                    >
                        ساخت گروه
                    </button>
                </div>
            </div>
        </div>
    );
}
