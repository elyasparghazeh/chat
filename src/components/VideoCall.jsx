import React, { useRef, useState, useEffect } from "react";

const VideoCall = ({ socket, currentUserId, targetUserId, incomingOffer }) => {
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const pc = useRef(null);
    const pendingCandidates = useRef([]);

    const [localStream, setLocalStream] = useState(null);
    const [inCall, setInCall] = useState(false);
    const [isCaller, setIsCaller] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const onAnswer = async ({ answer }) => {
            if (isCaller && pc.current) {
                await pc.current.setRemoteDescription(answer);
                await flushCandidates();
            }
        };

        const onIce = async ({ candidate }) => {
            if (!candidate) return;
            pendingCandidates.current.push(candidate);
            if (pc.current?.remoteDescription) await flushCandidates();
        };

        const onEnd = () => handleEndCall();

        socket.on("answer", onAnswer);
        socket.on("iceCandidate", onIce);
        socket.on("endCall", onEnd);

        return () => {
            socket.off("answer", onAnswer);
            socket.off("iceCandidate", onIce);
            socket.off("endCall", onEnd);
        };
    }, [socket, isCaller]);

    useEffect(() => {
        if (incomingOffer) {
            handleIncomingOffer(incomingOffer);
        }
    }, [incomingOffer]);

    const flushCandidates = async () => {
        while (pendingCandidates.current.length) {
            const c = pendingCandidates.current.shift();
            try {
                await pc.current.addIceCandidate(c);
            } catch {}
        }
    };

    const initPeerConnection = async () => {
        pc.current = new RTCPeerConnection();

        pc.current.onicecandidate = (event) => {
            if (event.candidate && targetUserId) {
                socket.emit("iceCandidate", { to: targetUserId, candidate: event.candidate });
            }
        };

        pc.current.ontrack = (event) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.current.addTrack(t, stream));

        return pc.current;
    };

    const startCall = async () => {
        setIsCaller(true);
        setInCall(true);

        const peer = await initPeerConnection();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("offer", { to: targetUserId, from: currentUserId, offer });
    };

    const handleIncomingOffer = async (offer) => {
        setInCall(true);
        const peer = await initPeerConnection();
        await peer.setRemoteDescription(offer);
        await flushCandidates();

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("answer", { to: targetUserId, answer });
    };

    const handleEndCall = () => {
        if (localVideo.current?.srcObject)
            localVideo.current.srcObject.getTracks().forEach((t) => t.stop());
        if (remoteVideo.current?.srcObject)
            remoteVideo.current.srcObject.getTracks().forEach((t) => t.stop());

        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }

        setInCall(false);
        setIsCaller(false);
        pendingCandidates.current = [];
    };

    const endCall = () => {
        socket.emit("endCall", { to: targetUserId });
        handleEndCall();
    };

    const toggleMute = () => {
        if (!localStream) return;
        const track = localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
    };

    return (
        <div className="flex flex-col items-center p-4 text-white space-y-4">
            {!inCall && (
                <button onClick={startCall} className="bg-blue-500 px-5 py-2 rounded-lg">
                    📞 شروع تماس
                </button>
            )}

            {inCall && (
                <>
                    <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
                        <video
                            ref={localVideo}
                            autoPlay
                            playsInline
                            muted
                            className="w-1/2 rounded-lg shadow-lg"
                        />
                        <video
                            ref={remoteVideo}
                            autoPlay
                            playsInline
                            className="w-1/2 rounded-lg shadow-lg"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={toggleMute}
                            className="bg-yellow-500 px-4 py-2 rounded-lg"
                        >
                            🔇 بی‌صدا/فعال
                        </button>
                        <button
                            onClick={endCall}
                            className="bg-red-600 px-4 py-2 rounded-lg"
                        >
                            ⏹ پایان تماس
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default VideoCall;
