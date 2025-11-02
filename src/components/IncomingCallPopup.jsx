import React from "react";
import { useNavigate } from "react-router";
import {useCall} from "./CallContext";

export default function IncomingCallPopup() {
    const navigate = useNavigate();
    const { incomingCall, setIncomingCall } = useCall();

    if (!incomingCall) return null;

    const accept = () => {
        navigate(`/call/${incomingCall.from}`, {
            state: { offer: incomingCall.offer, from: incomingCall.from },
        });
        setIncomingCall(null);
    };

    const decline = () => {
        setIncomingCall(null);
    };

    return (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-xl shadow-lg flex flex-col items-center animate-in fade-in zoom-in">
            <p className="font-medium">📞 تماس از کاربر {incomingCall.from}</p>
            <div className="flex gap-3 mt-3">
                <button
                    onClick={accept}
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg"
                >
                    قبول
                </button>
                <button
                    onClick={decline}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
                >
                    رد
                </button>
            </div>
        </div>
    );
}
