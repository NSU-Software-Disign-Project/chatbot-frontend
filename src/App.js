import './App.css';
import Diagram from "./pages/Diagram/Diagram"
import Homepage from './pages/Homepage/Homepage';
import AuthForm from "./pages/login&auth/AuthForm";
import UsersProject from "./pages/Projects/ProjectsPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
  <BrowserRouter>
      <Routes>
          <Route index element={<Homepage />} />
          <Route path="diagram" element={<Diagram />} />
          <Route path="/me" element={<UsersProject />} />
          <Route path="/auth" element={<AuthForm />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
