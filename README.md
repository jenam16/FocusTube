# FocusTube

> **"Learn from YouTube. Without the distractions."**

FocusTube is a distraction-free YouTube learning platform. It allows users to convert educational YouTube playlists into structured learning courses, track playback positions, focus deeply in a distraction-free environment, and complete courses seamlessly.

---

## Tech Stack

### Frontend
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router (`react-router-dom`)
- **Server State / Data Fetching:** TanStack Query (`@tanstack/react-query`)
- **Linting & Formatting:** ESLint, Prettier

### Backend
- **Runtime & Framework:** Node.js, Express
- **Language:** TypeScript
- **Database & ODM:** MongoDB Atlas, Mongoose
- **CORS & Environment:** cors, dotenv
- **Development Tooling:** tsx, ESLint, Prettier

---

## Repository Structure

```text
FocusTube/
├── client/                     # Frontend Vite + React + TypeScript app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # Route pages/views
│   │   ├── services/           # API and client-side services
│   │   ├── store/              # Zustand global client stores
│   │   ├── types/              # Client TypeScript type definitions
│   │   ├── utils/              # Client utility functions
│   │   ├── App.tsx             # App root component with providers & routes
│   │   ├── main.tsx            # DOM entry point
│   │   └── vite-env.d.ts       # Vite client ambient types
│   ├── .env.example            # Client environment variables template
│   ├── eslint.config.js        # Client ESLint flat config
│   ├── index.html              # HTML entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Backend Node.js + Express + TypeScript app
│   ├── src/
│   │   ├── config/             # Configuration & environment loader
│   │   ├── controllers/        # Request controllers
│   │   ├── middleware/         # Express middleware (auth, error handling)
│   │   ├── models/             # Mongoose data models
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic & external services
│   │   ├── types/              # Server TypeScript type definitions
│   │   ├── utils/              # Server utility functions
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # HTTP server listener
│   ├── .env.example            # Server environment variables template
│   ├── eslint.config.js        # Server ESLint flat config
│   ├── package.json
│   └── tsconfig.json
├── .env.example                # Combined environment variables template
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## Environment Variables

Copy the example environment files before running the project:

### Server (`server/.env`)
```bash
PORT=5000
MONGO_URI=
JWT_SECRET=your_jwt_secret_key_min_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

- `PORT`: Port the Express server listens on (default: `5000`).
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key used for signing authentication JWTs.
- `JWT_EXPIRES_IN`: JWT expiration duration (e.g. `7d`).
- `CLIENT_URL`: URL of the frontend application for CORS configuration.

### Client (`client/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

- `VITE_API_BASE_URL`: Base URL for calling the backend API.

---

## Local Setup

### Prerequisites
- Node.js (v18 or newer recommended, developed on v22)
- npm (v9 or newer)

### 1. Clone the repository
```bash
git clone <repository-url>
cd FocusTube
```

### 2. Configure Environment Variables
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

---

## Running the Applications

### Server (Backend)

```bash
cd server
npm install
npm run dev
```
- Development server starts on: `http://localhost:5000`
- Health check endpoint: `http://localhost:5000/api/health`
- Build for production: `npm run build`
- Run production build: `npm run start`
- Lint code: `npm run lint`
- Format code: `npm run format`

### Client (Frontend)

```bash
cd client
npm install
npm run dev
```
- Development server starts on: `http://localhost:5173`
- Build for production: `npm run build`
- Preview production build: `npm run preview`
- Lint code: `npm run lint`
- Format code: `npm run format`

---

## Phase 3 — Course Library + Dashboard
Status: Complete

Implemented:
* Dashboard (`/dashboard`) with real course counts, preview section, and shared import modal
* Course library (`/courses`) with search filtering, responsive grid, and real-time refresh
* Reusable UI components: `CourseCard`, `CourseGrid`, `ProgressBar`, `EmptyState`, `LoadingState`, `ErrorState`, `ImportCourseModal`
* Course cards with thumbnail fallbacks, human-readable duration (`45m`, `1h 20m`), completion percentage (`0% complete`), and progress bar
* Course detail page (`/courses/:id`) displaying course metadata, creator channel, total lessons, duration, progress bar, and ordered video syllabus (`position ASC`)
* Video list displaying positions (`01`, `02`), titles, duration, and availability status (unavailable videos handled gracefully without crashing)
* Client-side playlist URL validation with sanitized user-facing error messages

---

## Phase 4 — YouTube Video Player
Status: Complete

Implemented:
* Official YouTube IFrame Player integration via `YouTubePlayer` component (16:9 aspect ratio, loading & error states)
* Video selection directly on `/courses/:id` without page reloads or navigating away to YouTube
* Dual desktop layout: 2-column side-by-side (Player + Syllabus) and expandable Theater Mode ("Big Screen")
* Fullscreen mode support via native controls and browser Fullscreen API
* Dynamic video navigation (`Previous` and `Next` buttons) with automatic skipping of unavailable videos
* Boundaries enforced: `Previous` disabled on first playable video, `Next` disabled on last playable video
* Current video status header (`Currently watching: 03 — Title`) and active playing indicator in syllabus
* Graceful handling of unavailable videos (`isAvailable === false` disabled, non-crashing)
* Refresh-resilient state deriving default video as first playable video (`position ASC`)

---

## Phase 5 — Progress Tracking + Resume Learning
Status: Complete

Implemented:
* Real-time watch time tracking and periodic throttled syncing (every 10s or 10s position jump)
* Single-collection progress model (`VideoProgress`) with compound index `{ user: 1, course: 1, video: 1 }`
* Exact resume from last watched timestamp with smart threshold rules (skip if $\le 2$s or $\ge \text{duration} - 5$s)
* Unmount and lesson-switch flush guarantees
* Live course-level progress percentage aggregation
* "Continue Learning" dashboard card with recent course and video

---

## Phase 6 — Automatic Video Completion
Status: Complete

Implemented:
* **Automatic Video Completion Criteria**:
  - $\ge 90\%$ watched threshold rule (`clampedWatched / duration >= 0.90`)
  - Official player `ENDED` event (`onEnded`) triggering instant progress flush with `{ isEnded: true }`
* **Completion Immutability**:
  - Once `completed = true`, the video remains completed permanently for that user/video even if rewound or replayed to $<90\%$
  - `completedAt` timestamp is set once upon completion and never overwritten
* **Server-Authoritative Validation**:
  - Server evaluates watch time against video duration and sets `completed` & `completedAt`
* **Unavailable Video Exclusion**:
  - Course completion denominator excludes unavailable videos (`isAvailable !== false`)
  - Course marked completed (`courseCompleted = true`) when all available videos are completed
* **Next Lesson Advancement**:
  - "Continue Learning" automatically advances to the next incomplete available video in position order
  - If entire course is finished, "Continue Learning" displays "Course Completed" with review options
* **Visual Completion Badges**:
  - `CompletedBadge` component with green checkmark styling
  - Lesson syllabus shows checkmark badges, emerald progress bar, and "Completed" indicators
  - Course header & cards display completed lesson counts and "✓ Completed" badges

---

## Phase 7 — Focus Mode
Status: Complete

Implemented:
* **Distraction-Free Full-Screen Experience**:
  - Eliminates all peripheral distractions (navigation bar, footer, search, metadata, secondary sidebars)
  - Dedicated focus view with enlarged YouTube IFrame player centered in maximum readable viewport (`max-w-5xl`)
  - Deep dark theme (`bg-gray-950`) designed for extended focus sessions
* **No Player Remounting Guarantee**:
  - Seamless toggle between standard course view and Focus Mode without restarting playback, buffering, re-fetching video, or losing player state
  - Preserves exact YouTube IFrame instance in DOM reconciliation
* **Compact Header & Syllabus Drawer**:
  - `FocusModeHeader`: Minimal top bar with `Exit Focus Mode` button, course title, lesson progress stats, and drawer trigger
  - `FocusSyllabusDrawer`: Slide-over lesson drawer overlay allowing seamless syllabus inspection and lesson switching without leaving Focus Mode
  - `FocusModeControls`: Streamlined player footer with current lesson indicator, duration, completion badge, and Previous / Next lesson navigation
* **Keyboard & Fullscreen Controls**:
  - `Esc` key exits Focus Mode gracefully, intelligently respecting native browser fullscreen first if active
  - Locks background document scrolling while Focus Mode is active with strict unmount/exit cleanup
  - URL synchronization via `?focus=true` query parameter using `{ replace: true }` so browser navigation is preserved
* **Full Phase 0–6 Compatibility**:
  - Video progress tracking (Phase 5) and automatic completion (Phase 6) remain fully operational during Focus Mode
  - Seamlessly supported on both Course Detail (`/courses/:courseId`) and dedicated Watch (`/watch/:courseId/:videoId`) routes
