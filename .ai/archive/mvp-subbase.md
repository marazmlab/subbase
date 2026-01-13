> ⚠️ ARCHIVAL DOCUMENT
> This file is kept for reference only.
> It is NOT an active source of truth.

# App - Subbase (MVP)

## 🔻 Main Problem

These days, most technology—and many everyday—services run on subscriptions. Over time, it's easy to lose track of how many accounts we have, how much we're actually spending, whether we're paying for duplicate tools, or even whether we're still subscribed at all.

Subbase brings all your subscriptions into one place so you can track them effortlessly and see your spending clearly. With built-in AI insights, Subbase helps you spot overlaps, identify waste, and prioritize the services that truly deliver value—so you can optimize costs without losing what matters.

## 🔻 Smallest set of features

- Subscription CRUD: add, view, edit, and delete subscriptions displayed as easy-to-scan cards
- Dashboard showing monthly and yearly total subscription costs
- Secure user accounts with private subscription data (users can only see their own subscriptions)
- AI-powered insights: a single "Analyze my subscriptions" button that sends the list to an LLM and returns 1-3 text-based suggestions (e.g., potential overlaps or savings tips)

## 🔻 What's NOT included in an MVP?

### Collaboration & Social

- Share your subscription library with other users for collaborative access and visibility
- Enable social features for discovery, recommendations, and shared subscription planning
- Family/team subscription management
- Public profiles or subscription showcases

### Financial Features

- Multiple currency support and automatic conversion
- Bank/credit card integration for automatic subscription detection
- Payment method tracking (which card is used for what)
- Budget limits and spending alerts
- Historical spending trends and charts
- Export to CSV/PDF for accounting

### Notifications & Reminders

- Email/push notifications before renewal dates
- Cancellation deadline reminders
- Price change alerts
- Free trial expiration warnings

### Advanced Organization

- Custom categories and tags for subscriptions
- Search and filtering functionality
- Sorting options (by price, date, name, etc.)
- Archive/pause subscriptions without deleting
- Subscription notes or annotations

### UI/UX Enhancements

- Dark mode / theme customization
- Mobile-responsive design (beyond basic)
- Drag-and-drop reordering
- Dashboard widgets customization
- Data visualization (charts, graphs, pie charts)

### Advanced AI Features

- Automatic subscription detection from email parsing
- Personalized cancellation suggestions based on usage patterns
- Price comparison with alternative services
- Negotiation tips for lowering subscription costs
- AI response caching or history
- Streaming responses
- Multiple AI providers or model selection
- Custom prompt configuration

### Technical Features

- Offline mode / PWA support
- Multiple languages (i18n)
- Account settings (change email, password, delete account)
- Data backup and restore
- API for third-party integrations

## 🔻 Success Criteria

- User can register, log in, and only see their own subscriptions (no access to other users' data)
- Full CRUD works: create, edit, delete a subscription → change is immediately visible in the UI
- Dashboard calculates totals correctly (e.g., 3× monthly $10 + 1× yearly $120 = Monthly: $30, Yearly: $480)
- AI: clicking "Analyze" sends subscriptions to OpenAI API and displays at least 1 suggestion in the UI
