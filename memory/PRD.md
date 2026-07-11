# UGS HireFlow — PRD

## Original Problem Statement
Production-ready Consultancy Management System (CMS) called **UGS HireFlow** by UGS IT Solutions to replace 15 years of Excel-based recruitment. 3 roles: Super Admin, Employee/Recruiter, Candidate.

## Stack
- Backend: FastAPI + MongoDB (Motor async)
- Frontend: React 19 + Tailwind + Shadcn/UI + TanStack Query + Recharts + Sonner
- Auth: JWT + RBAC via `require_roles`
- Storage: Emergent Object Storage
- Fonts: Outfit (display) + Manrope (body)
- Palette: Royal Blue #2563EB, Emerald #10B981, gradient logo tint

## Modules — What's Implemented

### Phase 1 (Feb 2026)
- Public site (Home/About/Services/Contact/Register/Login), JWT auth, seed data (1 admin, 2 recruiters, 10 candidates, 5 companies, 10 jobs, 2 batches)
- Candidate CRUD + Companies + Jobs + Batches CRUD, Interview Pipeline Kanban, Dashboards (3 roles), Global Search, Notifications, Activity Log, Reports (charts + placements), CSV Export/Import, File Upload, Dark/Light theme, Settings + Change Password. Test suite 34/34.

### Phase 2 (Feb 2026 — Business Depth)
- **Partners** as first-class entity — created during candidate verification; searchable dropdown; per-partner candidate list & count; filter candidates by partner (`/app/partners`)
- **Comprehensive Candidate Registration** — 4-step wizard, multipart upload of photo/resume/certificates/experience-docs/supporting-docs at signup; reference_name + reference_phone captured
- **Verify V2 Dialog** — admin sees reference info; picks existing partner or creates new (dedupe by phone); links candidate ↔ partner atomically
- **Soft Delete / Archive / Restore / Permanent Delete** — full lifecycle with admin controls
- **Duplicate Detection** + **Merge Candidates** (payments/timeline/notes/documents/skills merged into target; source soft-deleted)
- **Profile Completion %** computed from field/list weights + progress bar
- **Employee Detail** — workload, stage breakdown, assigned candidates, activity, login history (`/app/employees/{id}`)
- **Company Hiring History** — stats + jobs + HR contacts (`/app/companies/{id}`)
- **Job Workspace** — close/reopen/bulk-allocate/remove-candidate/stats (`/app/jobs/{id}`)
- **Batch Detail** — mark running/completed, remove candidate (`/app/batches/{id}`)
- **Excel .xlsx Import** — preview + duplicate detection + skip-duplicates + import summary
- **Excel .xlsx Export** — filtered by status/employee/partner/payment
- **Organization Settings** — company/brand/email/phone/address/working hours/default fee
- **Saved Filters** per user
- **Notifications** — role-based triggers on candidate registered/verified/assigned, interview scheduled/selected/placed/offer, payment updated, company/job/batch created
- **Interconnected Navigation** — every list card links to detail; candidate detail shows Linked Records (Recruiter → Employee page, Company → Company page, Job → Job Workspace, Batch → Batch Detail, Partner → filtered candidate list)
- **Extended Global Search** — candidates, companies, jobs, employees, batches, partners (all sections navigable)
- **Login/Logout Activity Log** — auto-recorded
- **Global Error Handlers** — structured JSON 4xx/5xx responses
- **Branding** — UGS logo everywhere (sidebar, login, register, footer, favicon)

## Deferred (per user)
- PDF Export
- Advanced Report Generation
- WhatsApp/SMS/Email Automation
- Multi-branch
- AI features

### Phase 3 (Feb 2026 — Premium UI/UX)
- **Redesigned landing page** — 13 sections: Hero with cycling dashboard preview + floating stat cards, Animated Stats bar (15+, 25,000+, 1,500+, 300+, 100%), 5-stage Recruitment Workflow animation, 8-card Features grid (staggered reveal), Product Showcase (larger dashboard cycle), Why-Us (6 benefits), 3 Testimonials, FAQ accordion, CTA, Premium Footer.
- **Ambient background** — floating gradient blobs, faint grid, light rays with `prefers-reduced-motion` respect.
- **Animated components** — `AnimatedCounter` (ease-out cubic count-up), `WorkflowAnimation` (5 stages with pulsing rings + moving dots), `DashboardShowcase` (cycling browser mockup of 5 app screens with charts/timelines), `Reveal` / `Stagger` primitives.
- **Dashboard polish** — Skeleton loaders during load, animated KPI counters, staggered card entrance, `hover:-translate-y` micro-interactions.
- **Sidebar polish** — Framer-motion `layoutId` active pill that slides between routes, hover translate, collapse animation.
- **Page transitions** — Route changes fade+slide via AnimatePresence.
- **Public nav** — Theme toggle for pre-login preview.
- **Framer Motion 12** used throughout; GPU-friendly transforms only.
- **Accessibility** — `:focus-visible` rings, semantic markup, `prefers-reduced-motion` overrides.

### Phase 4 (Feb 2026 — Public Site Rebrand + Placement Gallery + Enquiries)
- **Public site rebranded to BES Consultancy** — logo, nav, footer, hero content, contact info all now use BES Consultancy identity. UGS HireFlow remains the internal software brand on /app.
- **Hero Section 1** — new content targeting freshers/graduates/job-seekers/experienced. Headline: "Welcome to BES Consultancy · Your Career Starts Here" (gradient on "Career Starts Here"). CTAs "Register Now" + "Explore Opportunities". Trust indicators. Right column swapped from DashboardShowcase to **RecruitmentJourney** — 6 floating cards (Student Profile → Profile Verified → Interview → Selected → Offer Letter → Placed) with continuous subtle motion, pulsing sparkles, and a traveling dot on the central spine.
- **NEW Section 2 — Recent Success Stories** — publishes real placement wins from a backend-managed gallery. Auto-scrolling glassmorphism marquee, hover-to-pause, edge fades, "Successfully Placed" badge, package + date + short description per card. Fetches `/api/public/placements`.
- **Sections 3+ untouched** — Stats, Workflow, Features, Product Showcase, Why-Us, Testimonials, FAQ, CTA remain identical.
- **Placement Gallery Admin Module** — `/app/placements`. CRUD for placements with multipart candidate_photo + company_logo uploads, publish/hide toggle, display_order. 8 sample placements auto-seeded on first boot.
- **Website Enquiries Admin Module** — `/app/enquiries`. Public contact form now persists to DB. Admin view with search, status filter (unread/read/replied), open dialog auto-marks as read, mark-replied with notes, delete, Excel export. Unread red badge on sidebar with live count.
- **Real-time admin notifications** fire for every new enquiry.

## Test Coverage
- Phase 1: 34/34 ✅
- Phase 2: 39/39 ✅
- Phase 3 UI regression: 100% ✅
- Phase 4: 91/91 (73 regression + 18 new) ✅

## Backlog (Version 2 — future)

## Test Credentials
- Admin: `admin@ugs.com` / `Admin@123`
- Recruiter: `priya@ugs.com` / `Employee@123`
- Recruiter: `rahul@ugs.com` / `Employee@123`
- Candidate: `arjun.k@example.com` / `Candidate@123`

## Test Coverage
- `/app/backend/tests/backend_test.py` — Phase 1 (34/34)
- `/app/backend/tests/test_phase2.py` — Phase 2 (39/39)
- Full regression clean. Frontend flows verified end-to-end via playwright.

## Backlog (Version 2 — future)
- PDF Export (reportlab): candidate PDF, filtered reports
- Advanced Analytics: TAT, recruiter leaderboard, monthly placement trends
- Email/SMS/WhatsApp automations (SendGrid/Twilio) — auto-nudge recruiter digest, interview reminders
- Mobile PWA
- Multi-branch support
