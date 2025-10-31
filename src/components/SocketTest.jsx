import React, {useState, useEffect} from "react";
import {io} from "socket.io-client";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

const socket = io("http://192.168.1.101:5000", {
    auth: {token},
});

export default function ChatApp() {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);

    // اتصال سوکت و مدیریت رویدادها
    useEffect(() => {
        socket.on("connect", () => {
            if (userId) socket.emit("join", userId);
        });

        socket.emit("getConversations", userId);

        const handlers = {
            conversationList: (e)=>{
            setConversations(e)
            },
            newConversation: (conversation) => {
                setConversations((prev) => {
                    const exists = prev.some((c) => c._id === conversation._id);
                    return exists ? prev : [conversation, ...prev];
                });
            },
        };

        Object.entries(handlers).forEach(([event, handler]) =>
            socket.on(event, handler)
        );

        return () => {
            Object.keys(handlers).forEach((event) => socket.off(event));
        };
    }, [activeChat, userId]);

    return (
        <div className="flex h-screen bg-gray-100">
            <ChatSidebar
                conversations={conversations}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
                socket={socket}
                userId={userId}
                token={token}
            />
            <ChatWindow
                activeChat={activeChat}
                userId={userId}
                socket={socket}
            />
        </div>
    );
}