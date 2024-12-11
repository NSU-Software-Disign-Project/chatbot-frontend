import './App.css';
import Diagram from "./pages/Diagram/Diagram"
import Messenger from "./pages/Messenger/Messenger"
import Homepage from './pages/Homepage/Homepage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MessengerApp from "./pages/Messenger/MessengerApp";

function App() {
  return (
  <BrowserRouter>
      <Routes>
          <Route index element={<Homepage />} />
          <Route path="diagram" element={<Diagram />} />
          <Route path="chat" element={<MessengerApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
