import React, { useState, useEffect } from "react";
import GroupModal from "./GroupModal";

export default function ChatSidebar({
                                        conversations,
                                        activeChat,
                                        setActiveChat,
                                        socket,
                                        userId,
                                        token,
                                    }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);

    // جستجوی کاربران
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const controller = new AbortController();
        const fetchUsers = async () => {
            try {
                const res = await fetch(
                    `http://192.168.1.101:5000/api/users/search?query=${encodeURIComponent(
                        searchTerm
                    )}`,
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

    // باز کردن چت با کاربر
    const openChatWithUser = (user) => {
        // اول سعی می‌کنیم یک conversation خصوصی بین current user و target user پیدا کنیم
        const existingPrivate = conversations.find((c) => {
            if (!c.isGroup) return  c.participants.some(p => p._id === user._id);
        });

        if (existingPrivate) {
            setActiveChat(existingPrivate);
            socket.emit("getMessages", existingPrivate._id);
        } else {
            setActiveChat({
                participants: [{ _id: userId }, { _id: user._id, name: user.name }],
                _id: user._id,
                isTemporary: true,
            });
        }

        setSearchTerm("");
        setSearchResults([]);
    };


    return (
        <div className="w-1/3 bg-white border-r flex flex-col shadow-lg">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">گفتگوها</h2>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b relative">
                <input
                    type="text"
                    placeholder="جستجو کاربران..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded-xl p-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                />
                {searchResults.length > 0 && (
                    <div className="absolute top-14 left-3 right-3 bg-white border rounded-xl shadow z-10 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                            <div
                                key={user._id}
                                className="p-2 cursor-pointer hover:bg-gray-100 border-b"
                                onClick={() => openChatWithUser(user)}
                            >
                                {user.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => {
                    const lastMsg = conv.lastMessage?.text || "پیامی نیست...";
                    return (
                        <div
                            key={conv._id}
                            onClick={() => {
                                setActiveChat(conv);
                                socket.emit("getMessages", conv._id);
                            }}
                            className={`p-3 cursor-pointer border-b hover:bg-gray-100 ${
                                activeChat?._id === conv._id ? "bg-blue-50" : ""
                            }`}
                        >
                            <p className="font-semibold">{conv.displayName}</p>
                            <p className="text-sm text-gray-500 truncate">{lastMsg}</p>
                        </div>
                    );
                })}
            </div>
            <button
                onClick={() => setShowGroupModal(true)}
                className="bg-blue-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-600"
            >
                + ساخت گروه
            </button>
            <GroupModal
                setActiveChat={setActiveChat}
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                token={token}
            />
        </div>
    );
}