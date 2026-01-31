# Quick Start Guide

Get Subbase running locally in 5 minutes!

## Prerequisites

- Node.js v22.14.0 (or use `nvm use`)
- npm (comes with Node.js)
- Docker (for local Supabase)

## Setup Steps

### 1. Clone and Install

```bash
git clone https://github.com/marazmlab/subbase.git
cd subbase
npm install
```

### 2. Start Local Supabase

```bash
npx supabase start
```

This will:
- ✅ Start local PostgreSQL database
- ✅ Run all migrations automatically
- ✅ Output your local credentials

**Copy the output!** You'll need it in the next step.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste your local Supabase credentials:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<paste anon key from supabase start output>
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=<paste anon key from supabase start output>

# Optional: Add OpenRouter key for AI features
OPENROUTER_API_KEY=your_key_here
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Open Your Browser

Navigate to: **http://localhost:4321**

## What's Next?

1. **Register a new account** at `/register`
2. **Log in** at `/login`
3. **Add your first subscription** on the dashboard
4. **Try AI insights** (if you added OpenRouter key)

## Troubleshooting

### "Connection refused" errors?
- Make sure Supabase is running: `npx supabase status`
- If not running: `npx supabase start`

### "Invalid API key" errors?
- Check your `.env` file has the correct Supabase credentials
- Make sure you copied the `anon key`, not the `service_role key`

### Port conflicts?
- Supabase uses ports 54321-54323
- Astro dev server uses port 4321
- Stop other services using these ports

## Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires Supabase running)
npm run test:e2e

# Tests with UI
npm run test:ui
npm run test:e2e:ui
```

## Useful Commands

```bash
# View Supabase status and credentials
npx supabase status

# Open Supabase Studio (database UI)
# Visit http://127.0.0.1:54323

# Reset database (fresh start)
npx supabase db reset

# Stop Supabase
npx supabase stop
```

## Need Help?

- Check [README.md](./README.md) for full documentation
- See [TESTING.md](./TESTING.md) for testing guide
- Check [supabase/README.md](./supabase/README.md) for database setup

---

**Happy coding! 🚀**
