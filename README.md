# HouseOps

A production-ready shared home management app built with Next.js 14, Supabase, and TypeScript.

## Features

- 🔐 **Authentication**: Google OAuth and email/password via Supabase
- 🏠 **House Management**: Create/join houses with invite codes
- 👥 **Member Management**: Add roommates with or without accounts, assign rooms
- 👤 **Visitors**: Track guests with date ranges, optionally include in expense splits
- 💰 **Expense Tracking**: Log expenses with equal/custom splits, mark payments
- 📦 **Inventory**: Track household supplies with low-stock alerts
- ✅ **Tasks**: Assign chores with due dates and completion tracking

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with glassmorphic design
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Google OAuth + Email/Password)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/houseops.git
cd houseops
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials.

4. Run the database migrations:
- Go to Supabase dashboard
- Open SQL Editor
- Run the contents of `supabase/schema.sql`

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## License

MIT
