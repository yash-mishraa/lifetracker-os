# LifeOS Tracker

> **An all-in-one personal productivity operating system** — tasks, habits, health, goals, focus sessions, weekly reviews, and deep analytics, all in one beautifully designed app.

---

## What is LifeOS?

LifeOS is a full-stack personal productivity tracker built with Next.js 14, Supabase, and a carefully curated component library. It replaces a half-dozen separate apps (Notion for goals, Habitica for habits, Toggl for time, MyFitnessPal for health...) with a single, deeply integrated system where every module informs the others.

The discipline score knows you had a bad focus day. The analytics page knows which day of the week you miss your habits. The dashboard tells you at a glance whether today is on track — before you open a single other app.

---

## Features

### 🎯 Daily Dashboard
The command center for your day. Shows animated metric rings for tasks, habits, and health; a live discipline score with trend chart; today's planner schedule; active goals; and a gamification layer with streaks and achievement badges — all on one screen.

- Real-time clock widget with an analog face, mini calendar, and a daily quote
- Metric rings with spring animations (tasks done, habits hit, health logged)
- Discipline Score card (0–100) broken down by tasks, habits, focus, and health
- Quick-action buttons to add tasks, habits, log health, or start a timer without navigating away

### 📋 Daily Planner
A block-based day planner where you map out your time in labeled blocks (Task, Focus, Break, Habit). Supports a week-strip for navigating between days, per-day stats (sessions, completed, planned time, actual time), and a persistent storage layer per user per day.

- Add, edit, and delete blocks with a form dialog
- Mark blocks complete with a checkbox; stats update in real time
- Days with planned blocks show indicator dots on the week strip
- "Jump to today" shortcut when browsing future/past days

### ✅ Task Management
Full task CRUD with priority levels (Low → Critical), statuses (To Do, In Progress, Completed, Blocked), deadlines, time estimates, tags, projects, subtasks, and recurrence.

- Four views: List, Kanban, Today (with overdue grouping), Calendar
- Deep Work mode — click the play icon on any task to enter a full-screen focus session with a circular timer countdown
- Tasks created with a deadline time are auto-linked to the planner for that day

### 🔥 Habits
Define binary (done/not done) or quantitative (e.g., "drink 8 glasses") habits with custom schedules (daily, specific days, or X times per week), a color, reminder time, and category.

- Last-7-days grid on each habit card for quick visual history
- Monthly heatmap modal per habit (color intensity = completion ratio)
- Streak tracking (current and longest), 30-day completion rate
- Optimistic UI updates — the card flips immediately, DB syncs in background

### 💪 Health Logging
Daily health log with sleep hours, water intake, steps, calories, weight, workout details, and mood. Single form to fill in everything for the day.

- Today's summary cards (Sleep, Water, Steps, Workout) always visible at the top
- 14-day trend charts: area chart for sleep, bar for water, bar for steps, line for weight
- Set personal goal thresholds (sleep hours target, water goal, steps goal) that feed the dashboard scoring

### 🎯 Goals & Milestones
Long-term goals organized by category (Career, Health, Learning, Finance, Personal) with optional target dates and milestone checklists.

- Progress ring per goal based on milestone completion ratio
- Days-remaining / overdue indicator
- Filter by category with a multi-select dropdown
- Goals overview stats: total goals, goals reached, active milestones, overall progress %

### ⏱️ Time Tracking
Two timer modes — Pomodoro (25m focus / 5m break cycles) and Manual (custom countdown or retroactive entry). Fullscreen overlay activates when a timer is running with a quote and progress ring.

- Link a timer session to any active task
- Today and this-week stats cards at the top
- Project time breakdown bar chart
- Session history table with delete

### 📅 Routines
Grouped checklists for Morning, Evening, and Other routines. Each routine has steps, a completion progress bar, and streak tracking.

- Fully separate from habits — routines are about sequences, not individual behaviors
- Streak and longest-streak display per routine card
- Completion triggers a toast ("Routine complete!")

### 📊 Analytics
The analytics page aggregates data from all modules into a single productivity score (0–100) with a breakdown (tasks 30 pts, habits 30 pts, focus 20 pts, health 20 pts), plus:

- Insight cards: most productive day, average sleep, habit success rate
- Activity trend charts: tasks by day (bar), focus time by day (area), water intake (line), active goals progress (horizontal bar)
- **Habit Deep Dive** section: success rate, failure pattern detection ("You miss habits mostly on Mondays"), streak prediction, activity heatmap, and a consistency trend line chart
- **Life Balance** radar chart across 6 life areas (Work, Health, Learning, Personal, Finance, Social) derived from your actual data

### 🏆 Weekly Review
Capture a structured weekly reflection with quantitative metrics auto-populated from the week's data (tasks done, habits hit, avg sleep, focus hours) plus free-text fields (what went well, what could improve, biggest achievement, habits maintained/missed). Full history stored and browsable in an accordion list.

### 🥇 Personal Records
Auto-calculated all-time records: longest habit streak, most focus hours in a day, most tasks completed in a day, best discipline score. No manual input needed — derived entirely from your logged data.

### 🔔 Notifications
A notification bell in the sidebar surfaces:
- Tasks due today or overdue
- Habits with a reminder time that has passed and are still incomplete
- A health check-in prompt after 8 PM if nothing was logged
- Goal deadline warnings (3 days or past due)

### 🎮 Gamification
Streaks, consistency scores, and unlockable achievement badges (Starter Streak, Monthly Master, Centurion, Deep Thinker) with animated progress bars. Badge unlock state is computed from real data — no fake XP.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Base UI (headless) + shadcn/ui patterns |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Charts | Recharts |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit |
| Date Handling | date-fns |
| Fonts | Inter, Plus Jakarta Sans, JetBrains Mono |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── dashboard/page.tsx      # Main command center
│   ├── plan/page.tsx           # Daily planner
│   ├── tasks/page.tsx          # Task management (redirects to /plan)
│   ├── habits/page.tsx         # Habit tracking
│   ├── health/page.tsx         # Health logging
│   ├── goals/page.tsx          # Goals & milestones
│   ├── time/page.tsx           # Time tracking
│   ├── routines/page.tsx       # Routine checklists
│   ├── analytics/page.tsx      # Aggregated analytics
│   ├── review/page.tsx         # Weekly review
│   ├── records/page.tsx        # Personal records
│   ├── deep-work/page.tsx      # Fullscreen focus timer
│   ├── login/page.tsx          # Auth page (animated)
│   └── onboarding/page.tsx     # 5-step setup wizard
│
├── components/
│   ├── ui/                     # Shared UI primitives (button, card, dialog, etc.)
│   ├── dashboard/              # Dashboard-specific cards and widgets
│   ├── analytics/              # Charts, heatmaps, insights
│   ├── habits/                 # Habit cards, dialog, heatmap, stats
│   ├── health/                 # Health log form, charts, history table
│   ├── goals/                  # Goal cards, dialogs, overview
│   ├── tasks/                  # Task card, list/kanban/today/calendar views
│   ├── time/                   # Active timer, log history, stats
│   ├── planner/                # Daily timeline, time block items, today's plan widget
│   ├── routines/               # Routine checklist, manager dialog
│   ├── review/                 # Reflection form, metrics summary, past reviews
│   ├── records/                # Personal record cards
│   ├── notifications/          # Notification bell, reminder items
│   ├── onboarding/             # 5 onboarding step components
│   ├── sidebar.tsx             # Desktop sidebar + mobile bottom nav
│   ├── client-app-wrapper.tsx  # Layout orchestrator
│   ├── auth-provider.tsx       # Supabase auth context
│   └── quick-add-fab.tsx       # Floating action button
│
└── lib/
    ├── services/               # All data access (Supabase queries + localStorage fallbacks)
    │   ├── task-service.ts
    │   ├── habit-service.ts
    │   ├── health-service.ts
    │   ├── goal-service.ts
    │   ├── time-service.ts
    │   ├── planner-service.ts
    │   ├── routine-service.ts
    │   ├── analytics-service.ts
    │   ├── dashboard-service.ts
    │   ├── discipline-service.ts
    │   ├── gamification-service.ts
    │   ├── life-balance-service.ts
    │   ├── records-service.ts
    │   ├── review-service.ts
    │   └── notification-service.ts
    ├── types/                  # TypeScript interfaces for all data models
    └── supabase.ts             # Supabase client + configuration check
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)

### Installation

```bash
git clone <repo-url>
cd lifeos-tracker
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note:** The app gracefully falls back to localStorage for most modules if Supabase is not configured. This makes it usable without a backend for quick demos, but health/tasks/habits will not sync across devices.

### Database Setup

Run the following table definitions in your Supabase SQL editor. All tables include Row Level Security (RLS) policies scoped to `auth.uid()`.

**Core tables required:**
- `tasks` — with `projects` join table
- `habits` and `habit_logs`
- `health_logs` and `health_goals`
- `goals` and `milestones`
- `time_logs`
- `weekly_reviews`
- `routines`, `routine_steps`, `routine_logs`

Enable Google OAuth in Supabase Auth → Providers if you want social login.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first login you'll be directed through the 5-step onboarding wizard.

---

## How the Scoring Works

### Discipline Score (0–100)
Computed daily from four categories:

| Category | Max Points | What counts |
|----------|-----------|-------------|
| Tasks | 40 | % of tasks due today that are completed |
| Habits | 30 | % of habits scheduled today that are logged |
| Focus | 20 | Time logged vs. 2-hour target (capped at 100%) |
| Health | 10 | Whether any health data was logged today |

Labels: **Unfocused** (0–39) · **Improving** (40–59) · **Disciplined** (60–79) · **Elite** (80–100)

### Productivity Score (Analytics, 0–100)
Same formula but evaluated over the selected time window (7/14/30 days):
- Task rate × 30
- Habit rate (logged vs expected) × 30
- Focus rate (total vs target of 2h/day) × 20
- Health logging rate × 20

### Consistency Score (Gamification)
Rolling 30-day count of "active days" (any task completed, habit logged, or focus session recorded) divided by 30, expressed as a percentage.

---

## Key Design Decisions

**Everything is computed, not stored (mostly).** Scores, streaks, analytics, and records are all derived at query time from raw event logs. This keeps the data model clean and makes retrospective re-computation trivial.

**Optimistic UI throughout.** Habit toggles, task completions, and routine steps update the UI immediately. The database write happens in the background. On failure, the state rolls back with a toast.

**Planner lives in localStorage.** Daily schedule blocks are stored as JSON in localStorage keyed by `user_id + date`. This avoids a complex real-time sync problem and keeps the planner fast and offline-capable.

**Local storage fallback.** If `NEXT_PUBLIC_SUPABASE_URL` is not set, all services fall back to localStorage. This makes the app demostrable without a backend, though with no cross-device sync.

**Mobile-first navigation.** On mobile, a bottom nav bar exposes the top 4 pages. A "More" sheet slides up with the full menu. On desktop, a fixed 256px sidebar is used.

---

## Screenshots / Pages

| Page | Path |
|------|------|
| Landing | `/` |
| Login | `/login` |
| Onboarding | `/onboarding` |
| Dashboard | `/dashboard` |
| Daily Planner | `/plan` |
| Habits | `/habits` |
| Health | `/health` |
| Goals | `/goals` |
| Time Tracking | `/time` |
| Routines | `/routines` |
| Analytics | `/analytics` |
| Weekly Review | `/review` |
| Personal Records | `/records` |
| Deep Work (focus) | `/deep-work?taskId=<id>` |

---

## Contributing

This project was built as a personal productivity tool and is open for extension. The service layer (`/lib/services`) is where all business logic lives — adding a new module means creating a service file, a types file, and a page.

PRs welcome for:
- Additional chart types in Analytics
- Supabase schema migration files
- Mobile PWA support
- Notification system (browser push or email)
- AI-powered weekly review summary generation

---

## License

MIT — use it, fork it, build on it.

---

*Built with too much coffee, too many tabs, and a genuine desire to replace 6 apps with 1.*
