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
import Header from "../components/Header";
import Footer from "../components/Footer";

const ProtectedLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

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
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<LandingPage />} />
              {/* add more protected routes here */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;
