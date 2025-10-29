import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoginPage from "../pages/Login";
import RegistrationPage from "../pages/Registration";
import LandingPage from "../pages/Landing";
import { AuthProvider } from "../context/AuthContext";
import { useAuthContext } from "../context/useAuthContext";

const AppRouter: React.FC = () => {
  const RequireAuth: React.FC = () => {
    const { isAuthenticated, loading } = useAuthContext();
    if (loading) {
      return null; // or a loading spinner
    }
    if (isAuthenticated) {
      return <Outlet />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />

          {/* protected routes */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<LandingPage />} />
            {/* add more protected routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;
