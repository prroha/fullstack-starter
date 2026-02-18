/**
 * Maps feature slugs to the API route prefixes they enable.
 * Core routes are always accessible. Module routes require the feature to be selected.
 */
export const FEATURE_ROUTE_MAP: Record<string, string[]> = {
  // Core — always enabled
  core: [
    "/api/v1/auth",
    "/api/v1/users",
    "/api/v1/admin",
    "/api/v1/search",
    "/api/v1/contact",
    "/api/v1/notifications",
    "/api/v1/faqs",
    "/api/v1/announcements",
    "/api/v1/settings",
    "/api/v1/content",
    "/api/v1/coupons",
    "/api/v1/orders",
    "/api/v1/config",
  ],

  // Ecommerce (prefix: /api/v1/ecommerce)
  "ecommerce.products": ["/api/v1/ecommerce/products", "/api/v1/ecommerce/categories"],
  "ecommerce.cart": ["/api/v1/ecommerce/cart"],
  "ecommerce.orders": ["/api/v1/ecommerce/orders"],
  "ecommerce.reviews": ["/api/v1/ecommerce/reviews"],
  "ecommerce.customers": ["/api/v1/ecommerce/customers"],
  "ecommerce.sellers": ["/api/v1/ecommerce/sellers"],

  // LMS (prefix: /api/v1/lms)
  "lms.courses": ["/api/v1/lms/courses"],
  "lms.lessons": ["/api/v1/lms/lessons"],
  "lms.enrollment": ["/api/v1/lms/enrollments"],
  "lms.quizzes": ["/api/v1/lms/quizzes"],
  "lms.certificates": ["/api/v1/lms/certificates"],
  "lms.instructors": ["/api/v1/lms/instructors"],

  // Booking (prefix: /api/v1/booking)
  "booking.services": ["/api/v1/booking/services"],
  "booking.providers": ["/api/v1/booking/providers"],
  "booking.bookings": ["/api/v1/booking/bookings"],
  "booking.schedules": ["/api/v1/booking/schedules"],
  "booking.reviews": ["/api/v1/booking/reviews"],
  "booking.admin": ["/api/v1/booking/admin"],

  // Helpdesk (prefix: /api/v1/helpdesk)
  "helpdesk.tickets": ["/api/v1/helpdesk/tickets"],
  "helpdesk.categories": ["/api/v1/helpdesk/categories"],
  "helpdesk.agents": ["/api/v1/helpdesk/agents"],
  "helpdesk.articles": ["/api/v1/helpdesk/articles"],
  "helpdesk.canned": ["/api/v1/helpdesk/canned-responses"],
  "helpdesk.sla": ["/api/v1/helpdesk/sla"],

  // Invoicing (prefix: /api/v1/invoicing)
  "invoicing.clients": ["/api/v1/invoicing/clients"],
  "invoicing.invoices": ["/api/v1/invoicing/invoices"],
  "invoicing.items": ["/api/v1/invoicing/invoice-items"],
  "invoicing.payments": ["/api/v1/invoicing/payments"],
  "invoicing.tax": ["/api/v1/invoicing/tax-rates"],
  "invoicing.recurring": ["/api/v1/invoicing/recurring"],

  // Events (prefix: /api/v1/events)
  "events.management": ["/api/v1/events/events", "/api/v1/events/venues"],
  "events.registration": ["/api/v1/events/registrations"],
  "events.speakers": ["/api/v1/events/speakers"],
  "events.settings": ["/api/v1/events/settings"],

  // Tasks (prefix: /api/v1/tasks)
  "tasks.management": ["/api/v1/tasks/projects", "/api/v1/tasks/tasks"],
  "tasks.comments": ["/api/v1/tasks/comments"],
  "tasks.labels": ["/api/v1/tasks/labels"],
  "tasks.settings": ["/api/v1/tasks/settings"],
};

/**
 * Reverse lookup: given a request path, find which feature is required.
 * Returns null for core routes (always allowed) and unknown routes.
 */
export function getRequiredFeature(path: string): string | null {
  for (const [feature, prefixes] of Object.entries(FEATURE_ROUTE_MAP)) {
    if (feature === "core") continue; // Always allowed
    for (const prefix of prefixes) {
      if (path.startsWith(prefix)) return feature;
    }
  }
  return null; // No feature required (core or unknown)
}
