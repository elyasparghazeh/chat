import React, {useEffect, useRef, useState} from "react";
import VideoCall from "./VideoCall";

export default function ChatWindow({activeChat, userId, socket}) {
    const typing = useRef(false);
    const typingTimeout = useRef(null);
    const [msgInput, setMsgInput] = useState("");
    const [typingUsers, setTypingUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [replyTo, setReplyTo] = useState(null);


    useEffect(() => {
        if (!activeChat)
            return;
        if (activeChat._id) {
            socket.emit("joinConversation", activeChat._id);
        }
        socket.on("typingStatus", ({senderId, isTyping}) => {
            setTypingUsers((prev) => {
                if (isTyping) {
                    if (!prev.includes(senderId)) {
                        return [...prev, senderId];
                    }
                    return prev;
                } else {
                    return prev.filter((id) => id !== senderId);
                }
            });
        });
        socket.on("messageList", setMessages)
        socket.on("receiveMessage", (msg) => {
            console.log(msg)
            if (activeChat && msg.conversationId === activeChat._id) setMessages((prev) => [msg, ...prev]);
        })
        return () => {
            socket.off("typingStatus")
            socket.off("messageList")
            socket.off("receiveMessage")
        };
    }, [activeChat])
    // ارسال پیام
    const sendMessage = (e) => {
        e.preventDefault();
        if (!msgInput.trim() || !activeChat) return;

        const receiver = !activeChat.isGroup && activeChat.participants.find((p) => p._id !== userId);
        socket.emit("sendMessage", {
            senderId: userId,
            receiverId: receiver?._id,
            conversationId: activeChat._id,
            text: msgInput,
            replyTo: replyTo?._id || null, // 👈 اضافه شد

        });
        setMsgInput("");
        setReplyTo(null);
    };

    // تایپینگ
    const handleTyping = (e) => {
        const value = e.target.value;
        setMsgInput(value);

        if (!activeChat) return;

        const receiverId = activeChat._id;

        // اگر تایپ قبلا شروع نشده بود، یکبار emit کن
        if (!typing.current) {
            socket.emit("typing", {senderId: userId, receiverId, isTyping: true});
            typing.current = true;
        }

        // پاک کردن تایمر قبلی
        if (typingTimeout.current) clearTimeout(typingTimeout.current);

        // بعد از 2 ثانیه توقف، emit false و reset flag
        typingTimeout.current = setTimeout(() => {
            socket.emit("typing", {senderId: userId, receiverId, isTyping: false});
            typing.current = false; // آماده برای تایپ بعدی
        }, 2000);
    };

    if (!activeChat) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                یک گفتگو را انتخاب کنید
            </div>
        );
    }

    const typingNames = activeChat?.participants
        .filter(p => p._id !== userId && typingUsers.includes(p._id))
        .map(p => p.name);

    const targetUser = activeChat.participants.find(
        (p) => p._id !== userId
    );


    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white border-b shadow-sm">
                <h2 className="text-lg font-semibold">{activeChat?.name || "کاربر"}</h2>
                <VideoCall
                    socket={socket}
                    currentUserId={userId}
                    targetUserId={targetUser._id}
                />
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col-reverse p-4 overflow-y-auto bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        className={`flex ${
                            msg.sender._id === userId ? "justify-end" : "justify-start"
                        } mb-2`}
                    >
                        <div
                            className={`p-2 rounded-2xl max-w-xs relative ${
                                msg.sender._id === userId
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-900"
                            }`}
                        >
                            {/* بخش ریپلای */}
                            {msg.replyTo && (
                                <div className="text-xs text-gray-300 border-l-2 pl-2 mb-1 italic">
                                    پاسخ به: {msg.replyTo.text?.slice(0, 40)}...
                                </div>
                            )}
                            <p>{msg.text}</p>
                            <span className="text-xs text-gray-400 block text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                            {/* دکمه ریپلای */}
                            <button
                                onClick={() => setReplyTo(msg)}
                                className="absolute -top-2 -right-2 text-xs bg-white rounded-full px-1 text-blue-500 shadow"
                            >
                                ↩️
                            </button>
                        </div>
                    </div>
                ))}

                {replyTo && (
                    <div className="bg-blue-100 p-2 rounded-t-lg border-t border-l border-r relative">
                        <p className="text-sm text-gray-700">
                            پاسخ به: <span className="font-semibold">{replyTo.sender.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 italic truncate">{replyTo.text}</p>

                        <button
                            onClick={() => setReplyTo(null)}
                            className="absolute top-1 right-2 text-gray-500 hover:text-red-500"
                        >
                            ✕
                        </button>
                    </div>
                )}


            </div>

            {/* Typing Indicator */}
            {typingNames.length > 0 && (
                <p className="text-sm text-gray-500 px-4 mb-2">
                    {typingNames.join(", ")} در حال تایپ کردن...
                </p>
            )}

            {/* Input Form */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
                <input
                    type="text"
                    value={msgInput}
                    onChange={handleTyping}
                    placeholder="پیامت رو بنویس..."
                    className="flex-1 border rounded-lg p-2 focus:outline-none"
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white rounded-xl px-4 hover:bg-blue-600 transition"
                >
                    ارسال
                </button>
            </form>
        </div>
    );
}