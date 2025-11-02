import React from "react";
import { useLocation, useParams, useNavigate } from "react-router";
import VideoCall from "../components/VideoCall";
import {useCall} from "./CallContext";

export default function CallRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { socket, userId } = useCall();

    const incomingOffer = location.state?.offer;

    return (
        <div className="w-screen h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
            <VideoCall
                socket={socket}
                currentUserId={userId}
                targetUserId={id}
                incomingOffer={incomingOffer}
            />
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 right-4 bg-gray-700 px-4 py-2 rounded-lg"
            >
                ← بازگشت
            </button>
        </div>
    );
}
