import React from "react";
import MarketTable from "../components/MarketTable";
import useTickerStream from "../hooks/useTickerStream";

const LandingPage: React.FC = () => {
  const { rows, status, error, lastUpdated } = useTickerStream();

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white">
          Live Market Dashboard
        </h1>
        <p className="text-sm text-white/70">
          Streaming 24h stats across spot and perpetual markets.
        </p>
      </header>

      <MarketTable
        rows={rows}
        status={status}
        error={error}
        lastUpdated={lastUpdated}
      />
    </section>
  );
};

export default LandingPage;
