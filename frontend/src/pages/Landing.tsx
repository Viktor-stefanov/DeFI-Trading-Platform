import React from "react";

const LandingPage: React.FC = () => {
  return (
    <section className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-3xl font-extrabold text-white">
          Welcome to DeFi Platform
        </h1>
        <p className="text-sm text-white/70">
          Your dashboard will appear here. (Placeholder)
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="rounded-lg bg-white/5 p-6 text-white/90">
          <p className="text-sm">
            This area is ready for widgets like balances, PnL charts, and active
            orders.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-base font-semibold text-white">
              Quick actions
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Hook up entry points for deposits, withdrawals, or new trades once
              the backend endpoints are ready.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-base font-semibold text-white">
              Market overview
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Drop a market summary component here to highlight top assets or
              open positions.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
};

export default LandingPage;
