import React from "react";
import AuthLayout from "../components/AuthLayout";

const LandingPage: React.FC = () => {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome to DeFi Platform
          </h1>
          <p className="text-sm text-white/70">
            Your dashboard will appear here. (Placeholder)
          </p>
        </header>

        <main className="pt-4">
          <div className="rounded-lg bg-white/3 p-6 text-white/90">
            <p className="text-sm">
              This is a minimal landing page. Add your dashboard components
              here.
            </p>
          </div>
        </main>
      </div>
    </AuthLayout>
  );
};

export default LandingPage;
