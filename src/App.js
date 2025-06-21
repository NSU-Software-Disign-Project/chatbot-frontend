import "./App.css";
import Diagram from "./pages/Diagram/Diagram";
import Homepage from "./pages/Homepage/Homepage";
import AuthForm from "./pages/login&auth/AuthForm";
import UsersProject from "./pages/Projects/ProjectsPage";
import CollaborativeTest from "./pages/CollaborativeTest";
import SharedProject from "./pages/SharedProject";
import CollaborativePage from "./pages/CollaborativePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Homepage />} />
        <Route path="diagram" element={<Diagram />} />
        <Route path="/me" element={<UsersProject />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/collaborative-test" element={<CollaborativeTest />} />
        <Route path="/shared-project/:projectId" element={<SharedProject />} />
        <Route
          path="/collaborative/:shareToken"
          element={<CollaborativePage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
