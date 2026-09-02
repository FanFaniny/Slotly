```
.
├── apps/
│   ├── api/                          # Backend API (Fastify + tRPC + Better Auth)
│   │   └── src/
│   │       ├── auth.ts               # Better Auth instance (exported `Auth` type)
│   │       ├── lib/
│   │       │   └── booking-rate-limit.ts  # In-memory rate limiter for booking mutations
│   │       ├── plugins/
│   │       │   └── booking-rate-limit.ts  # Fastify plugin: preHandler hook applying rate limit
│   │       ├── routes/
│   │       │   └── auth.ts           # Auth routes (`/api/auth/*`, `/api/me`) + env URL helper
│   │       └── services/
│   │           ├── email.ts          # Booking email data + sending
│   │           ├── onboarding.ts     # Ensures master profile exists (creates on first login)
│   │           └── sentry.ts         # Sentry init + captureException wrapper
│   │
│   └── web/                          # Frontend (React + Vite + tRPC client)
│       └── src/
│           ├── components/
│           │   ├── AuthPanel.tsx     # Sign-in / Sign-up form (Better Auth client)
│           │   ├── booking/
│           │   │   ├── BookingCalendar.tsx   # Month calendar for date selection
│           │   │   ├── DynamicBookingForm.tsx # Renders custom form fields (zod validated)
│           │   │   ├── HoldCountdown.tsx     # Countdown timer for slot hold expiry
│           │   │   └── SlotGrid.tsx          # Time slot grid for a selected date
│           │   └── ui/               # shadcn-style UI primitives
│           │       ├── badge.tsx
│           │       ├── button.tsx
│           │       ├── card.tsx
│           │       ├── input.tsx
│           │       ├── skeleton.tsx
│           │       └── textarea.tsx
│           ├── layouts/
│           │   ├── AdminLayout.tsx   # Admin shell with sidebar nav
│           │   └── PublicLayout.tsx  # Public site header/layout
│           ├── lib/
│           │   ├── trpc.ts           # tRPC client factory (httpBatchLink, credentials)
│           │   └── utils.ts          # `cn()` helper, formatPrice, formatDuration
│           ├── pages/
│           │   ├── BookingSuccessPage.tsx  # Confirmation page + AddToCalendar
│           │   ├── LoginPage.tsx          # Redirects to /admin if already logged in
│           │   └── admin/
│           │       ├── CalendarPage.tsx   # Admin calendar (tRPC `admin.calendar.getEvents`)
│           │       ├── ClientsPage.tsx    # Client list with search
│           │       ├── DashboardPage.tsx  # Dashboard with revenue chart (Recharts)
│           │       ├── ServicesPage.tsx   # Service CRUD
│           │       └── SettingsPage.tsx   # Profile, booking settings, work schedule, form fields
│           ├── stores/
│           │   └── booking-store.ts  # Booking step state (1 | 2 | 3)
│           ├── types/
│           │   └── client.ts         # Client and client table component type definitions
│           └── vite-env.d.ts         # Vite env types (VITE_API_URL)
│
├── packages/
│   ├── db/                           # Database package (Drizzle ORM)
│   │   └── src/
│   │       ├── client.ts             # createDb/getDb (Neon or Postgres driver)
│   │       └── schema/
│   │           ├── blocked-times.ts  # BlockedTime table
│   │           ├── bookings.ts       # Bookings table
│   │           ├── clients.ts        # Clients table
│   │           ├── enums.ts          # BookingStatus enum
│   │           ├── master-settings.ts# Master settings (buffer, advance, horizon)
│   │           ├── masters.ts        # Masters (service providers)
│   │           ├── services.ts       # Services offered
│   │           ├── slot-holds.ts     # Slot holds (temporary locks)
│   │           ├── types.ts          # FormFieldType, BookingFormField, BookingFormSchema
│   │           └── work-schedules.ts # Weekly work schedule blocks
│   │
│   ├── shared/                       # Shared types/utilities
│   │   └── src/
│   │       ├── availability/
│   │       │   └── types.ts          # TimeInterval, AvailableSlot, ComputeAvailabilityInput, etc.
│   │       ├── dayjs.d.ts            # Dayjs plugin type declarations (utc, tz)
│   │       └── forms.ts              # Form field types (duplicated from db schema types)
│   │
│   └── trpc/                         # tRPC server + router definitions
│       └── src/
│           ├── context.ts            # AuthUser, AuthSession, CreateContextOptions
│           ├── dayjs.d.ts            # Dayjs plugin type declarations
│           ├── router.ts             # AppRouter type (root router)
│           └── services/
│               ├── admin/
│               │   ├── calendar.ts   # BlockedTimeInput + calendar service
│               │   ├── clients.ts    # ClientUpdateInput + client service
│               │   ├── services.ts   # ServiceInput + create/delete service
│               │   └── settings.ts   # Profile/Settings/WorkSchedule/FormSchema updates
│               ├── booking-helpers.ts# AvailabilityError class + shared helpers
│               ├── booking.ts        # createHold, confirmBooking (transactional)
│               └── ics.ts            # BookingIcsInput + ICS calendar generation
```
