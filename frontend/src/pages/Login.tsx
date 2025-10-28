import React from "react";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import LoginIcon from "../assets/icons/login.svg";

const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <header className="mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-br from-indigo-400 to-pink-400 flex items-center justify-center">
              <img
                src={LoginIcon}
                alt="login icon"
                className="h-5 w-5 text-white"
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                Welcome back
              </h1>
              <p className="text-sm text-white/70">
                Sign in to trade on our DeFi spot & futures markets.
              </p>
            </div>
          </div>
        </header>

        <main>
          <AuthForm mode="login" />
        </main>

        <footer className="pt-2 text-xs text-white/60">
          By signing in you agree to our{" "}
          <span className="text-indigo-300">Terms</span> and{" "}
          <span className="text-indigo-300">Privacy</span>.
        </footer>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
