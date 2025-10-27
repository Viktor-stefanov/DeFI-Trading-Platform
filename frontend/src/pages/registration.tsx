import React from "react";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import RegisterIcon from "../assets/icons/register.svg";

const RegistrationPage: React.FC = () => {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <header className="mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-br from-rose-400 to-amber-400 flex items-center justify-center">
              <img
                src={RegisterIcon}
                alt="register icon"
                className="h-5 w-5 text-white"
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                Create your account
              </h1>
              <p className="text-sm text-white/70">
                Join the DeFi spot & futures marketplace.
              </p>
            </div>
          </div>
        </header>

        <main>
          <AuthForm mode="register" />
        </main>

        <section className="pt-4 grid grid-cols-3 gap-3 text-xs text-white/70">
          <div className="col-span-3 sm:col-span-1">
            <strong className="text-white">Fast</strong>
            <div>Create account in seconds</div>
          </div>
          <div className="col-span-3 sm:col-span-1">
            <strong className="text-white">Secure</strong>
            <div>Encrypted by default</div>
          </div>
          <div className="col-span-3 sm:col-span-1">
            <strong className="text-white">Insightful</strong>
            <div>Get actionable metrics</div>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
};

export default RegistrationPage;
