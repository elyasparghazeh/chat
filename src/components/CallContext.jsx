import React, {createContext, useContext, useEffect, useState} from "react";
import {io} from "socket.io-client";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const userId = localStorage.getItem("userId");
const token = localStorage.getItem("token");
const socket = io(process.env.REACT_APP_BASE_URL, {
    auth: {token},
});
export const CallProvider = ({children}) => {
    const [incomingCall, setIncomingCall] = useState(null);


    useEffect(() => {
        if (!socket) return;

        const onOffer = ({from, offer}) => {
            setIncomingCall({from, offer});
        };

        socket.on("offer", onOffer);
        return () => socket.off("offer", onOffer);
    }, [socket]);

    return (
        <CallContext.Provider
            value={{
                socket,
                userId,
                token,
                incomingCall,
                setIncomingCall,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};
