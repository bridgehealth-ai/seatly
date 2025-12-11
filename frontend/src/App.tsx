import {Navigate, Route, Routes} from "react-router-dom";
import SignupPage from "@/pages/signup/SignupPage";
import LoginPage from "@/pages/login/LoginPage";
import {RequireAuth} from "@/context/RequireAuth";
import DeskDashboardPage from "@/pages/deskdashboard/DeskDashboardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
      <Route path="/signup" element={<SignupPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route element={<RequireAuth/>}>
        <Route path="/dashboard" element={<DeskDashboardPage/>}/>
      </Route>
    </Routes>
  );
}

export default App;