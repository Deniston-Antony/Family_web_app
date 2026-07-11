# FamilyChat

A production-ready real-time chat application built with Next.js 15, featuring one-to-one messaging, friend management, online presence, and a modern responsive UI with dark/light mode.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-orange)

## Features

- **Authentication** — Register, login, logout with bcrypt password hashing, Zod validation, and protected routes
- **Real-time Messaging** — Socket.IO powered instant messaging with typing indicators and read receipts
- **Friend System** — Send, accept, reject, and cancel friend requests
- **User Search** — Instant search by username or name
- **Online Presence** — Live online/offline status with last seen timestamps
- **Message Features** — Text, emoji picker, edit, delete, copy, Enter to send, Shift+Enter for newline
- **Notifications** — New messages, friend requests, and accepted requests
- **Settings** — Update profile, bio, password, theme, and profile picture
- **Responsive UI** — Three-column desktop layout, mobile-optimized navigation
- **Dark/Light Mode** — System-aware theme switching

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Auth.js v5) |
| Real-time | Socket.IO |
| Validation | Zod |
| Password Hashing | bcryptjs |

## Project Structure

```
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # REST API endpoints
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/           # Reusable React components
│   ├── auth/             # Authentication forms
│   ├── chat/             # Chat UI components
│   ├── friends/          # Friend management
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   └── ui/               # Base UI components
├── hooks/                # Custom React hooks
├── lib/                  # Server utilities (auth, prisma, validation)
├── prisma/               # Database schema & seed
├── socket/               # Socket.IO event handlers
├── types/                # TypeScript type definitions
├── utils/                # Client utilities
└── server.ts             # Custom server (Next.js + Socket.IO)
```

## Prerequisites

- **Node.js** 18.17+ (recommended: 20 LTS)
- **PostgreSQL** 14+ (local or [Supabase](https://supabase.com))
- **npm** or **yarn**

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/family-chat.git
cd family-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database — PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/family_chat?schema=public"

# Auth — Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# Rate limiting (optional)
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
```

### 4. Set up the database

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Seed sample data
npm run db:seed
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The dev server uses a custom Node.js server (`server.ts`) that runs both Next.js and Socket.IO on port 3000.

## Test Accounts

After seeding, use these accounts (password: `Password123!`):

| Email | Username | Name |
|-------|----------|------|
| alice@example.com | alice | Alice Johnson |
| bob@example.com | bob | Bob Smith |
| charlie@example.com | charlie | Charlie Brown |
| diana@example.com | diana | Diana Prince |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Socket.IO |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## Database Schema

| Table | Description |
|-------|-------------|
| `User` | User profiles with auth credentials |
| `FriendRequest` | Pending/accepted/rejected friend requests |
| `Friendship` | Established friend relationships |
| `Conversation` | Chat conversation containers |
| `ConversationParticipant` | Users in each conversation |
| `Message` | Chat messages with status tracking |
| `Session` | Auth session storage (for OAuth providers) |

All tables include `id`, `createdAt`, `updatedAt` with appropriate foreign keys, indexes, and cascade deletes.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET | `/api/users/search?q=` | Search users |
| GET/POST | `/api/friends` | List friends / send request |
| GET/PATCH | `/api/friends/requests` | List / manage requests |
| GET/POST | `/api/conversations` | List / create conversations |
| GET | `/api/conversations/[id]` | Get messages |
| POST | `/api/messages` | Send message (REST fallback) |
| PATCH/DELETE | `/api/messages/[id]` | Edit / delete message |
| GET/PATCH | `/api/settings` | Profile settings |
| GET | `/api/profile/[id]` | User profile |
| POST | `/api/upload` | Profile picture upload |

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:connected` | Server → Client | User came online |
| `user:disconnected` | Server → Client | User went offline |
| `message:sent` | Bidirectional | New message |
| `message:delivered` | Client → Server → Client | Message delivered |
| `message:read` | Client → Server → Client | Message read |
| `typing:start` | Client → Server → Client | User is typing |
| `typing:stop` | Client → Server → Client | User stopped typing |
| `friend:online` | Server → Client | Friend came online |
| `friend:offline` | Server → Client | Friend went offline |
| `notification` | Server → Client | Push notification |

## Security

- Passwords hashed with bcrypt (12 rounds)
- All API inputs validated with Zod schemas
- Protected routes via NextAuth middleware
- SQL injection prevention via Prisma parameterized queries
- XSS mitigation via React's built-in escaping
- CSRF protection via NextAuth session tokens
- Login rate limiting (configurable attempts per window)

## Deployment

### Deploy PostgreSQL on Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string
3. Replace `[YOUR-PASSWORD]` with your database password
4. Set `DATABASE_URL` in your environment variables

### Deploy to Vercel

> **Important:** Socket.IO requires a persistent WebSocket connection. Vercel's serverless functions do not support long-lived Socket.IO connections. For full real-time functionality in production, deploy the Socket.IO server separately (e.g., Railway, Render, Fly.io) and set `NEXT_PUBLIC_SOCKET_URL` to that server's URL.

**Option A — Full app on a Node.js host (recommended for Socket.IO):**

Deploy to [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io):

```bash
# Build
npm run build

# Start (runs custom server with Socket.IO)
npm start
```

Set environment variables on your hosting platform.

**Option B — Vercel (frontend + API only):**

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Deploy a separate Socket.IO server and update `NEXT_PUBLIC_SOCKET_URL`

```bash
# Vercel CLI (optional)
npm i -g vercel
vercel
```

### GitHub Actions

CI runs automatically on push/PR to `main`:
- ESLint check
- Prettier format check
- Production build

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret key |
| `NEXTAUTH_URL` | Yes | App URL for auth callbacks |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.IO server URL |
| `LOGIN_RATE_LIMIT_MAX` | No | Max login attempts (default: 5) |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 900000) |

## License

MIT
# Family_web_app
