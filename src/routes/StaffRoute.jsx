import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function StaffRoute({ children }) {
  const token = localStorage.getItem("token");
  console.log('StaffRoute: Token from localStorage:', token);

  if (!token) {
    console.log('StaffRoute: No token, redirecting to /');
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    console.log('StaffRoute: Decoded token:', decoded);
    
    // Get role from localStorage (set during login)
    const userRole = localStorage.getItem("userRole");
    console.log('StaffRoute: User role from localStorage:', userRole);

    if (userRole !== "staff") {
      console.log('StaffRoute: Role is not staff, redirecting to /dashboard');
      return <Navigate to="/dashboard" replace />;
    }

    console.log('StaffRoute: Access granted to /staff');
    return children;
  } catch (error) {
    console.log('StaffRoute: JWT decode error:', error);
    return <Navigate to="/" replace />;
  }
}