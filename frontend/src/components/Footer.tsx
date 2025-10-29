import React from "react";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 text-xs text-white/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
        <span>© {year} DeFi Trading Platform</span>
        <span className="text-white/50">All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
