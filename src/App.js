import './App.css';
import {Route, Routes} from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />}/>
                <Route path="/" element={<Home />}/>
            </Routes>
        </>
    );
}

export default App;
