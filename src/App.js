import './App.css';
import {Route, Routes} from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import {CallProvider} from "./components/CallContext";
import CallRoom from "./components/CallRoom";
import IncomingCallPopup from "./components/IncomingCallPopup";

function App() {
    return (
        <>
            <CallProvider>
                <IncomingCallPopup/>
                <Routes>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/call/:id" element={<CallRoom/>}/>
                </Routes>
            </CallProvider>
        </>
    );
}

export default App;
