import {

  adminAvailabilityRouter,

  publicAvailabilityRouter,

} from "./routers/availability.js";

import { adminAnalyticsRouter } from "./routers/admin/analytics.js";

import { adminCalendarRouter } from "./routers/admin/calendar.js";

import { adminClientsRouter } from "./routers/admin/clients.js";

import { adminServicesRouter } from "./routers/admin/services.js";

import { adminSettingsRouter } from "./routers/admin/settings.js";

import { authRouter } from "./routers/auth.js";

import { publicBookingRouter } from "./routers/booking.js";

import { healthRouter } from "./routers/health.js";

import { publicProfileRouter } from "./routers/public/profile.js";

import { router } from "./trpc.js";



export const appRouter = router({

  health: healthRouter,

  auth: authRouter,

  public: router({

    profile: publicProfileRouter,

    availability: publicAvailabilityRouter,

    booking: publicBookingRouter,

  }),

  admin: router({

    availability: adminAvailabilityRouter,

    services: adminServicesRouter,

    clients: adminClientsRouter,

    settings: adminSettingsRouter,

    calendar: adminCalendarRouter,

    analytics: adminAnalyticsRouter,

  }),

});



export type AppRouter = typeof appRouter;

