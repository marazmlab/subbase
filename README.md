# Subbase

> Track your subscriptions, understand your costs, and gain AI-powered insights—all in one place.

## Overview

Subbase is a web-based application that helps individuals manually track recurring subscriptions, understand their monthly and yearly costs, and gain AI-powered insights to increase cost awareness. Built as part of an AI-assisted full-stack learning workflow, Subbase provides a centralized overview of your recurring expenses and helps you reflect on your spending habits.

### The Problem

Over time, users accumulate multiple subscriptions (streaming services, SaaS tools, memberships) and lose visibility into:

- How many subscriptions they currently have
- How much they spend on a recurring basis
- Whether multiple subscriptions overlap in purpose
- Which subscriptions are still worth their cost

### The Solution

"All subscriptions in one place, clear monthly and yearly cost totals, and optional AI insights that help users reflect on their spending."

## Tech Stack

### Frontend
- **[Astro](https://astro.build/)** 5 - Modern web framework for building fast, content-focused websites
- **[React](https://react.dev/)** 19 - UI library for building interactive components
- **[TypeScript](https://www.typescriptlang.org/)** 5 - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** 4 - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Beautifully designed, accessible component library

### Backend & Database
- **[Supabase](https://supabase.com/)** - Open-source Firebase alternative for authentication and database

### AI
- **[OpenRouter.ai](https://openrouter.ai/)** - Unified API for AI model communication

### CI/CD & Hosting
- **GitHub Actions** - Continuous integration and deployment
- **Digital Ocean** - Application hosting

## Getting Started Locally

### Prerequisites

- **Node.js** v22.14.0 (specified in `.nvmrc`)
- **npm** (comes with Node.js)
- A Supabase account and project

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/subbase.git
cd subbase
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory with your configuration:

```env
# Add your Supabase and OpenRouter credentials here
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to `http://localhost:4321` to see the application.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start the Astro development server |
| `build` | `npm run build` | Build the project for production |
| `preview` | `npm run preview` | Preview the production build locally |
| `astro` | `npm run astro` | Run Astro CLI commands |
| `lint` | `npm run lint` | Run ESLint to check for code issues |
| `lint:fix` | `npm run lint:fix` | Automatically fix ESLint issues |
| `format` | `npm run format` | Format code with Prettier |

## Project Scope

### MVP Features (In Scope)

This MVP focuses on core functionality that delivers immediate user value:

- ✅ **User Authentication** - Secure registration and login
- ✅ **Subscription Management** - Create, view, edit, and delete subscriptions
- ✅ **Subscription Overview** - See all subscriptions in one centralized location
- ✅ **Cost Calculations** - Automatic monthly and yearly recurring cost totals
- ✅ **AI-Powered Insights** - User-triggered AI analysis of subscription spending patterns
- ✅ **Responsive UI** - Basic responsive design for different screen sizes
- ✅ **Error Handling** - Basic loading states and error handling

### Out of Scope (Post-MVP)

The following features are intentionally excluded from the MVP to maintain focus:

- ❌ Automatic subscription detection or third-party integrations
- ❌ Notifications or reminders for upcoming renewals
- ❌ Historical analytics, charts, or spending trends
- ❌ Multi-currency support
- ❌ Advanced organization (tags, filters, search functionality)
- ❌ Shared accounts or multi-user features
- ❌ Native mobile app or offline support
- ❌ Internationalization (i18n)

### AI Feature Details

The AI component acts as a **cost-awareness assistant** with the following characteristics:

- **User-Triggered**: AI insights are explicitly requested by the user, not automatic
- **Metadata-Only**: Analysis relies solely on subscription metadata (name, cost, billing cycle)
- **Conservative Observations**: Provides high-level insights without making assumptions about actual usage
- **Non-Prescriptive**: Avoids authoritative recommendations or financial advice
- **Graceful Degradation**: Core functionality remains fully usable if AI is unavailable

The AI is designed to help users reflect on their spending, not to make decisions for them.

## Project Status

**Current Version:** 0.0.1 (MVP in Development)

This is an active learning project focused on AI-assisted full-stack development. The primary goals are:

1. ✅ Deliver a functional MVP with clear user value
2. ✅ Practice structured database, API, UI, and AI planning
3. ✅ Explore modern web development technologies
4. 🚧 Complete core subscription management features
5. 🚧 Implement AI-powered insights

## Project Structure

```
subbase/
├── src/
│   ├── layouts/         # Astro layouts
│   ├── pages/           # Astro pages and routes
│   │   └── api/         # API endpoints
│   ├── components/      # UI components (Astro & React)
│   │   └── ui/          # Shadcn/ui components
│   ├── lib/             # Services and utility functions
│   ├── db/              # Supabase clients and types
│   ├── middleware/      # Astro middleware
│   ├── types.ts         # Shared types and interfaces
│   └── styles/          # Global styles
├── public/              # Static assets
└── .ai/                 # AI planning and documentation
```

## Core User Stories

### Authentication
- As a user, I can register and log in to access my subscriptions
- As a user, my data is private and isolated from other users

### Subscription Management
- As a user, I can add new subscriptions with details (name, cost, billing cycle)
- As a user, I can edit existing subscription information
- As a user, I can delete subscriptions I no longer have
- As a user, I can see all my subscriptions in one place

### Overview & Insights
- As a user, I can see how much I spend monthly and yearly on all subscriptions
- As a user, I can trigger AI insights to better understand my subscription spending

## Contributing

This is a learning project, but contributions, suggestions, and feedback are welcome! Please follow the coding practices and AI guidelines defined in the `.cursor/rules/` directory.

## License

MIT

---

**Note:** This is a learning project built as part of an AI-assisted development workflow. It is not intended for production use or to provide financial advice.
