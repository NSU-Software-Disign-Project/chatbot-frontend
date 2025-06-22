import './App.css';
import Diagram from "./pages/Diagram/Diagram"
import Homepage from './pages/Homepage/Homepage';
import LoginForm from "./pages/login&auth/LoginForm";
import RegisterForm from "./pages/login&auth/RegisterForm";
import UsersProject from "./pages/Projects/ProjectsPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from './Header';

function App() {
  return (
  <BrowserRouter>
      <Header />
      <Routes>
          <Route index element={<Homepage />} />
          <Route path="/diagram/:id" element={<Diagram />} />
          <Route path="/me" element={<UsersProject />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
