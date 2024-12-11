import "./App.css";
import Diagram from "./pages/Diagram/Diagram";
import Homepage from "./pages/Homepage/Homepage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatInterface from "./pages/MessengerInterface/ChatInterface";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Homepage />} />
        <Route path="diagram" element={<Diagram />} />
        <Route path="chat" element={<ChatInterface />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
