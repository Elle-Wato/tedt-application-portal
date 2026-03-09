import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ApplicationForm from "./pages/ApplicationForm";
import Success from "./pages/Success";

import StaffRoute from "./routes/StaffRoute";
import StaffDashboard from "./pages/staff/StaffDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply" element={<ApplicationForm />} />
        <Route path="/success" element={<Success />} />

        {/* Staff-only route */}
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffDashboard />
            </StaffRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<h2>Page Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
