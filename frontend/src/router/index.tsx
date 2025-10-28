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
    console.debug("RequireAuth check", { isAuthenticated, loading });
    if (loading) {
      console.debug("RequireAuth waiting for auth initialization");
      return null; // or a loading spinner
    }
    if (isAuthenticated) {
      console.debug("RequireAuth allowing access");
      return <Outlet />;
    }
    console.debug("RequireAuth redirecting to /login");
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
