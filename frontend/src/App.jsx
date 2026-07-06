import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import StudentHome from "./components/StudentHome";
import StudentDashboard from "./components/StudentDashboard";
import MentorDashboard from "./components/MentorDashboard";
import StudentHistory from "./components/StudentHistory";
import ChatSurvey from "./components/ChatSurvey";

function NavBar() {
  return (
    <div
      style={{
        background: "var(--dark)",
        padding: "1rem 1.5rem",
        display: "flex",
        gap: "1.5rem",
      }}
    >
      <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 600 }}>
        Student Home
      </Link>
      <Link to="/mentor" style={{ color: "var(--mint)", textDecoration: "none", fontWeight: 600 }}>
        Mentor Dashboard
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/dashboard/:studentId" element={<StudentDashboard />} />
        <Route path="/history/:studentId" element={<StudentHistory />} />
        <Route path="/checkin/:studentId" element={<ChatSurvey />} />
        <Route path="/mentor" element={<MentorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;