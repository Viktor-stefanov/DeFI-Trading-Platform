import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthContext from "../context/useAuthContext";

const navItems = [{ label: "Dashboard", to: "/" }];

const Header: React.FC = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-white"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500 text-base font-bold text-white shadow-lg">
            DF
          </span>
          <span className="hidden text-sm sm:inline">
            DeFi Trading Platform
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "text-white/70 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={busy}
          className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
};

export default Header;
