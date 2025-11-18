import { Navigate, Outlet } from "react-router-dom";

export function PrivateRoute({ isLoggedIn }) {
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />
}