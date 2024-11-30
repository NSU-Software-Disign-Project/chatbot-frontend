import './App.css';
import Diagram from "./pages/Diagram/Diagram"
import Homepage from './pages/Homepage/Homepage';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
<BrowserRouter>
      <Routes>
          <Route index element={<Homepage />} /> 
          <Route path="diagram" element={<Diagram />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
