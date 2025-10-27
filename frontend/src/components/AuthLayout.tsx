import React from "react";

const AuthLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 auth-bg -z-10" aria-hidden="true" />

      <div className="max-w-md w-full p-8 bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl border border-white/6">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
