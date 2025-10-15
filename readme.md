# Usage

I assume you have git and npm installed on your machine. If not - go install
them :D.

1. Clone git repository

- `git clone git@github.com:Viktor-stefanov/DeFI-Trading-Platform.git`

2. Install frontend and backend dependencies

- `cd frontend && npm i`
- `cd backend && npm i`

3. Run frontend and backend servers

- `npm run dev` in both frontend and backend directories

4. Open browser at `http://localhost:5173` and enjoy the experience.

# Time management and de-scoping

- Hour 1: think about the general architecture of the backend and how it will
  communicate with the frontend. Tighten the CORS policy, bootstrap the backend.
- Hour 2-4: Implement the backend. Starting with the data model -> TS types ->
  general flow of data in the backend. Implement placeholders for simulating
  slippage and an AMM (didn't have enough time to finish). Test ws and HTTP
  routes are workign as expected. Make ws ticking configurable so high / low
  pressure can be tested. Test in CLI via `curl`.
- Hour 5-6: Frontend work. Setup react + vite project. Think about how many
  components will be required and why. What will be conditionally rendered and
  what not. Didn't have enough time to create a thorough API calling instance
  e.g. axios so the fetch API is used basically in-line (I know, I know... I was
  time limited).

What could be added to the project:

- Orders could be performed via a constant AMM for a more "real" feeling.
- Frontend UI/UX could be enhanced greatly (I am a frontend dev, not a designer)
