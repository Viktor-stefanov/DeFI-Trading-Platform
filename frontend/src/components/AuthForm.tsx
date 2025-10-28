import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

type Mode = "login" | "register";

interface Props {
  mode?: Mode;
}

const AuthForm: React.FC<Props> = ({ mode = "register" }) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { login, register, walletLogin } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (isRegister && !fullName.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email.";
    // simple email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      if (isRegister) {
        const res = await register({ fullName, email, password });
        console.debug("AuthForm register result", res);
        if (res.success) {
          navigate("/login");
        } else {
          setError(res.message ?? "Registration failed");
        }
      } else {
        const res = await login({ email, password });
        console.debug("AuthForm login result", res);
        if (res.success) {
          navigate("/");
        } else {
          setError(res.message ?? "Invalid credentials");
        }
      }
    } catch (err) {
      // keep generic message for users; log full error for debugging
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await walletLogin();
      console.debug("AuthForm walletLogin result", res);
      if (res.success) {
        navigate("/");
      } else {
        setError(res.message ?? "Wallet login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isRegister && (
          <div>
            <label className="text-sm text-white/80">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md p-2 bg-white/5 text-white border border-white/6 focus:ring-2 focus:ring-indigo-400"
              placeholder="Jane Doe"
            />
          </div>
        )}

        <div>
          <label className="text-sm text-white/80">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md p-2 bg-white/5 text-white border border-white/6 focus:ring-2 focus:ring-indigo-400"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="text-sm text-white/80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md p-2 bg-white/5 text-white border border-white/6 focus:ring-2 focus:ring-indigo-400"
            placeholder="••••••••"
          />
        </div>

        {error && <div className="text-sm text-rose-300">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-60"
        >
          {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/6" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-3 text-white/60">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWalletLogin}
          disabled={loading}
          className="w-full py-2 rounded-md border border-white/8 bg-black/10 text-white flex items-center justify-center gap-2 hover:bg-black/20 disabled:opacity-60"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M12 2l7 11-7 5-7-5 7-11z"
              fill="currentColor"
              opacity="0.9"
            />
          </svg>
          Connect with MetaMask
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-white/75">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-300 font-medium">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/register" className="text-indigo-300 font-medium">
              Create an account
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
