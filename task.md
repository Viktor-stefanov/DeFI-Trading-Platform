Hi Viktor,

Thanks again for the chat. To keep things efficient, we use a time-boxed
challenge that mirrors our day-to-day work (real-time data + clean UI + small
API). Please aim for 4–6 hours total. If you run out of time, ship what you have
and document trade-offs—quality over scope.

Goal (what to build) A mini real-time trading panel with:

a live markets table that stays smooth under frequent updates

a simple order form that posts to a small backend and shows the result instantly

You can simulate data—no external exchange dependency required.

Required Stack Frontend: React (Next.js or Vite) + TypeScript, Zustand for state

Backend: Node.js + Express (TypeScript preferred)

Styling: Tailwind or CSS of your choice

Frontend Requirements Markets Table (8 symbols)

Subscribe to a WebSocket feed (your backend).

Columns: Symbol, Last Price, 24h Change %, Volume.

Rows should visually indicate updates (e.g., brief green/red flash on change).

Keep UI smooth while receiving frequent ticks (see Performance note).

Order Form

Fields: symbol (select), side (buy/sell), quantity (number).

Submit to backend POST /orders.

Optimistic update: show the order immediately in an Orders list; reconcile on
server response.

State & Performance

Use Zustand selectors to avoid table-wide re-renders.

Batch incoming updates (e.g., coalesce every 100–200ms or use
requestAnimationFrame).

Memoize row renderers; avoid recomputation churn.

Basic UX

Responsive layout.

Minimal but tidy UI (no need for design system).

Error states: show when WebSocket disconnects; simple retry button.

Backend Requirements WebSocket Ticker

Endpoint (e.g., /ws/ticker) sending simulated ticks for 8 symbols (random walk).

Push messages at high-ish frequency (suggest ~20–50 msg/sec total across
symbols).

Orders API

POST /orders (body: symbol, side, qty) → returns created order with server
timestamp & id.

GET /orders → returns in-memory list (persist only in process).

Minimal Security & Hygiene

Accept a static Bearer token (e.g., Authorization: Bearer demo) and reject
missing/invalid tokens.

Input validation (symbol whitelist, qty > 0).

CORS configured narrowly.

What to deliver GitHub repo with /frontend and /backend (or monorepo).

README with:

how to run both parts

your time spent and what you de-scoped

brief notes on state architecture and batching strategy

(Optional) small gif/video of it running.

Evaluation (we keep it simple) We’ll score 0–2 on each:

Real-time handling — coalescing updates; no jank under steady ticks.

React performance — Zustand selectors, memoization, minimal re-renders.

API design & backend hygiene — clear routes, validation, simple auth.

Code quality — TS types, structure, naming, small components/functions.

UX polish — readable table, update flash, error/reconnect states.

10/10 = immediate trial; 8–9 = strong; ≤7 = not the bar.

Hard Constraints (so tasks stay comparable) Time-box yourself to ≤6 hours.

No heavy libraries for state beyond Zustand/TanStack Query (ok to use a tiny
chart lib if you choose to add a sparkline, but not required).

Do not depend on external exchanges; simulate locally.

Hints (totally optional) Generate ticks via random walk per symbol; compute 24h
change% relative to a fixed baseline.

Keep a single WS listener; buffer updates; commit to store on a cadence.

Use Zustand subscribeWithSelector and shallow compares.

For optimistic orders: add to local list immediately; replace with server
response when it returns.

Send us the repo link when ready. If you hit the time limit, ship and note the
trade-offs you’d make with another day.
