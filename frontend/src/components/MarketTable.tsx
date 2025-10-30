import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StreamStatus, TickerRow } from "../hooks/useTickerStream";

interface MarketTableProps {
  rows: TickerRow[];
  status: StreamStatus;
  lastUpdated: number | null;
  error: string | null;
}

const PAGE_SIZES = [50, 100];

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const MarketTable: React.FC<MarketTableProps> = ({
  rows,
  status,
  lastUpdated,
  error,
}) => {
  const [page, setPage] = useState(0);
  const [pageSizeIndex, setPageSizeIndex] = useState(0);
  const pageSize = PAGE_SIZES[pageSizeIndex];
  const prevPricesRef = useRef<Record<string, number>>({});

  const totalCount = rows.length;
  const totalPages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / pageSize) : 1;
  }, [pageSize, totalCount]);

  const priceDirections = useMemo(() => {
    const directions: Record<string, "up" | "down" | null> = {};
    for (const row of rows) {
      const previous = prevPricesRef.current[row.symbol];
      if (previous === undefined) {
        directions[row.symbol] = null;
        continue;
      }
      if (row.lastPrice > previous) {
        directions[row.symbol] = "up";
      } else if (row.lastPrice < previous) {
        directions[row.symbol] = "down";
      } else {
        directions[row.symbol] = null;
      }
    }
    return directions;
  }, [rows]);

  useEffect(() => {
    if (!totalCount) {
      setPage(0);
      return;
    }
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalCount, totalPages]);

  useEffect(() => {
    const snapshot: Record<string, number> = {};
    for (const row of rows) {
      snapshot[row.symbol] = row.lastPrice;
    }
    prevPricesRef.current = snapshot;
  }, [rows]);

  const paginatedRows = useMemo(() => {
    if (!totalCount) return [];
    const start = page * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize, totalCount]);

  const [rangeStart, rangeEnd] = totalCount
    ? [page * pageSize + 1, Math.min(totalCount, (page + 1) * pageSize)]
    : [0, 0];

  const handlePageSizeToggle = () => {
    setPage(0);
    setPageSizeIndex((prev) => (prev + 1) % PAGE_SIZES.length);
  };

  const handlePrevPage = () => setPage((prev) => Math.max(0, prev - 1));
  const handleNextPage = () =>
    setPage((prev) => Math.min(totalPages - 1, prev + 1));

  const subtitle = useMemo(() => {
    if (error) return error;
    if (status === "unconfigured")
      return "Set VITE_TICKER_WS_URL to stream live data.";
    if (status === "connecting") return "Connecting to market feed…";
    if (status === "closed") return "Feed closed. Waiting for new updates.";
    if (status === "error")
      return "Feed error. Check network logs and try again.";
    if (!totalCount) return "Awaiting first market snapshot…";
    return `Streaming ${totalCount.toLocaleString()} markets`;
  }, [error, status, totalCount]);

  const lastUpdatedLabel = lastUpdated
    ? timestampFormatter.format(new Date(lastUpdated))
    : "—";

  return (
    <section className="flex flex-1 flex-col">
      <header className="flex flex-col gap-2 pb-4 text-sm text-white/70 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Market Overview</h2>
          <p>{subtitle}</p>
        </div>
        <span className="text-xs text-white/50">
          Last update: <span className="text-white/60">{lastUpdatedLabel}</span>
        </span>
      </header>

      <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
        <div className="flex flex-col gap-3 border-b border-white/10 bg-white/10 px-4 py-3 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {totalCount
              ? `Showing ${rangeStart}-${rangeEnd} of ${totalCount.toLocaleString()} markets`
              : "No markets to display yet."}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePageSizeToggle}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              Step: {pageSize}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 0 || totalCount === 0}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-white/60">
                Page {totalCount ? page + 1 : 0} of{" "}
                {totalCount ? totalPages : 0}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages - 1 || totalCount === 0}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <table className="w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/10 text-xs uppercase tracking-wide text-white/60">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Pair
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Last Price
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                24h Δ
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                24h %
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                High
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Low
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Volume
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Quote Volume
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white/80">
            {paginatedRows.map((row) => {
              const percentClass =
                row.priceChangePercent >= 0
                  ? "text-emerald-300"
                  : "text-rose-300";
              const deltaClass =
                row.priceChange >= 0 ? "text-emerald-200" : "text-rose-200";
              const pulseClass =
                priceDirections[row.symbol] === "up"
                  ? "price-pulse-up"
                  : priceDirections[row.symbol] === "down"
                    ? "price-pulse-down"
                    : "";
              return (
                <tr key={row.symbol} className="transition hover:bg-white/5">
                  <td className="px-4 py-3 font-semibold text-white">
                    {row.symbol}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`tabular-nums ${pulseClass}`}>
                      {priceFormatter.format(row.lastPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`tabular-nums ${deltaClass} ${pulseClass}`}
                    >
                      {row.priceChange >= 0 ? "+" : ""}
                      {priceFormatter.format(row.priceChange)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`tabular-nums ${percentClass} ${pulseClass}`}
                    >
                      {row.priceChangePercent >= 0 ? "+" : ""}
                      {row.priceChangePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`tabular-nums ${pulseClass}`}>
                      {priceFormatter.format(row.highPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`tabular-nums ${pulseClass}`}>
                      {priceFormatter.format(row.lowPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`tabular-nums ${pulseClass}`}>
                      {compactNumberFormatter.format(row.volume)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`tabular-nums ${pulseClass}`}>
                      {compactNumberFormatter.format(row.quoteVolume)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!totalCount && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-white/60"
                >
                  {status === "connected"
                    ? "No markets received yet."
                    : subtitle}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MarketTable;
