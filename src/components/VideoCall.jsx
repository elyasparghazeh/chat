import React, { useRef, useState, useEffect } from "react";

const VideoCall = ({ socket, currentUserId, targetUserId }) => {
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const pc = useRef(null);

    const [localStream, setLocalStream] = useState(null);
    const [callIncoming, setCallIncoming] = useState(null);
    const [inCall, setInCall] = useState(false);

    // --- تنظیم لیسنرهای WebSocket
    useEffect(() => {
        if (!socket) return;

        socket.on("offer", async ({ from, offer }) => {
            setCallIncoming({ from, offer });
        });

        socket.on("answer", async ({ answer }) => {
            if (pc.current) await pc.current.setRemoteDescription(answer);
        });

        socket.on("iceCandidate", async ({ candidate }) => {
            if (pc.current && candidate) {
                try {
                    await pc.current.addIceCandidate(candidate);
                } catch (e) {
                    console.error("ICE error", e);
                }
            }
        });

        socket.on("endCall", handleEndCall);

        return () => {
            socket.off("offer");
            socket.off("answer");
            socket.off("iceCandidate");
            socket.off("endCall");
        };
    }, [socket]);

    // --- ساخت PeerConnection
    const initPeerConnection = async () => {
        pc.current = new RTCPeerConnection();

        pc.current.onicecandidate = (event) => {
            if (event.candidate && targetUserId) {
                socket.emit("iceCandidate", {
                    to: targetUserId,
                    candidate: event.candidate,
                });
            }
        };

        pc.current.ontrack = (event) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        // دریافت stream فقط در صورت نیاز
        let stream = localStream;
        if (!stream) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
        }

        if (localVideo.current && !localVideo.current.srcObject) {
            localVideo.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));
    };

    // --- شروع تماس (caller)
    const startCall = async () => {
        if (!targetUserId) return alert("کاربر مقابل مشخص نیست");

        await initPeerConnection();
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);

        socket.emit("offer", {
            to: targetUserId,
            from: currentUserId,
            offer,
        });

        setInCall(true);
    };

    // --- پذیرش تماس (callee)
    const acceptCall = async () => {
        await initPeerConnection();
        await pc.current.setRemoteDescription(callIncoming.offer);
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        socket.emit("answer", {
            to: callIncoming.from,
            answer,
        });

        setInCall(true);
        setCallIncoming(null);
    };

    // --- رد تماس
    const declineCall = () => {
        setCallIncoming(null);
    };

    // --- قطع تماس
    const handleEndCall = () => {
        if (localVideo.current?.srcObject) {
            localVideo.current.srcObject.getTracks().forEach((t) => t.stop());
        }
        if (remoteVideo.current?.srcObject) {
            remoteVideo.current.srcObject.getTracks().forEach((t) => t.stop());
        }
        if (pc.current) {
            pc.current.ontrack = null;
            pc.current.onicecandidate = null;
            pc.current.close();
            pc.current = null;
        }
        setInCall(false);
        setCallIncoming(null);
    };

    const endCall = () => {
        socket.emit("endCall", { to: targetUserId });
        handleEndCall();
    };

    // --- mute / unmute
    const toggleMute = () => {
        if (!localStream) return;
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
    };

    return (
        <div className="p-4 space-y-4">
            {!inCall && (
                <button
                    onClick={startCall}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                    📞 شروع تماس ویدیویی
                </button>
            )}

            {callIncoming && (
                <div className="bg-gray-800 text-white p-4 rounded-lg">
                    <p>درخواست تماس از {callIncoming.from}</p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={acceptCall}
                            className="bg-green-500 px-3 py-1 rounded"
                        >
                            قبول
                        </button>
                        <button
                            onClick={declineCall}
                            className="bg-red-500 px-3 py-1 rounded"
                        >
                            رد
                        </button>
                    </div>
                </div>
            )}

            {inCall && (
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <video
                        ref={localVideo}
                        autoPlay
                        playsInline
                        muted
                        className="w-1/2 rounded-lg shadow"
                    />
                    <video
                        ref={remoteVideo}
                        autoPlay
                        playsInline
                        className="w-1/2 rounded-lg shadow"
                    />
                </div>
            )}

            {inCall && (
                <div className="flex gap-3 mt-3">
                    <button
                        onClick={toggleMute}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                    >
                        🔇 بی‌صدا / فعال
                    </button>
                    <button
                        onClick={endCall}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        ⏹ پایان تماس
                    </button>
                </div>
            )}
        </div>
    );
};

export default VideoCall;
