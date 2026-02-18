import { FastifyPluginAsync } from "fastify";

// Core routes — direct import of the core route aggregator
import coreRoutes from "../../../../core/backend/src/routes/index.js";

// Ecommerce module routes
import ecommerceProductRoutes from "../../../../modules/ecommerce/backend/src/routes/product.routes.js";
import ecommerceCartRoutes from "../../../../modules/ecommerce/backend/src/routes/cart.routes.js";
import ecommerceOrderRoutes from "../../../../modules/ecommerce/backend/src/routes/order.routes.js";
import ecommerceReviewRoutes from "../../../../modules/ecommerce/backend/src/routes/review.routes.js";
import ecommerceSellerRoutes from "../../../../modules/ecommerce/backend/src/routes/seller.routes.js";
import ecommerceCustomerRoutes from "../../../../modules/ecommerce/backend/src/routes/customer.routes.js";

// LMS module routes
import lmsCourseRoutes from "../../../../modules/lms/backend/src/routes/course.routes.js";
import lmsEnrollmentRoutes from "../../../../modules/lms/backend/src/routes/enrollment.routes.js";
import lmsLessonRoutes from "../../../../modules/lms/backend/src/routes/lesson.routes.js";
import lmsQuizRoutes from "../../../../modules/lms/backend/src/routes/quiz.routes.js";
import lmsCertificateRoutes from "../../../../modules/lms/backend/src/routes/certificate.routes.js";
import lmsInstructorRoutes from "../../../../modules/lms/backend/src/routes/instructor.routes.js";

// Booking module routes
import bookingServiceRoutes from "../../../../modules/booking/backend/src/routes/service.routes.js";
import bookingScheduleRoutes from "../../../../modules/booking/backend/src/routes/schedule.routes.js";
import bookingBookingRoutes from "../../../../modules/booking/backend/src/routes/booking.routes.js";
import bookingProviderRoutes from "../../../../modules/booking/backend/src/routes/provider.routes.js";
import bookingReviewRoutes from "../../../../modules/booking/backend/src/routes/review.routes.js";
import bookingAdminRoutes from "../../../../modules/booking/backend/src/routes/admin-booking.routes.js";

// Helpdesk module routes
import helpdeskTicketRoutes from "../../../../modules/helpdesk/backend/src/routes/ticket.routes.js";
import helpdeskCategoryRoutes from "../../../../modules/helpdesk/backend/src/routes/category.routes.js";
import helpdeskArticleRoutes from "../../../../modules/helpdesk/backend/src/routes/article.routes.js";
import helpdeskSlaRoutes from "../../../../modules/helpdesk/backend/src/routes/sla.routes.js";
import helpdeskAgentRoutes from "../../../../modules/helpdesk/backend/src/routes/agent.routes.js";
import helpdeskCannedResponseRoutes from "../../../../modules/helpdesk/backend/src/routes/canned-response.routes.js";

// Invoicing module routes
import invoicingInvoiceRoutes from "../../../../modules/invoicing/backend/src/routes/invoice.routes.js";
import invoicingClientRoutes from "../../../../modules/invoicing/backend/src/routes/client.routes.js";
import invoicingPaymentRoutes from "../../../../modules/invoicing/backend/src/routes/payment.routes.js";
import invoicingTaxRateRoutes from "../../../../modules/invoicing/backend/src/routes/tax-rate.routes.js";
import invoicingInvoiceItemRoutes from "../../../../modules/invoicing/backend/src/routes/invoice-item.routes.js";
import invoicingRecurringRoutes from "../../../../modules/invoicing/backend/src/routes/recurring.routes.js";

// Events module routes (has centralized index)
import eventsRoutes from "../../../../modules/events/backend/src/routes/index.js";

// Tasks module routes (has centralized index)
import tasksRoutes from "../../../../modules/tasks/backend/src/routes/index.js";

/**
 * Preview backend route registration.
 *
 * Registers ALL core + module routes under a unified API.
 * The feature gate middleware (registered as onRequest hook) blocks
 * routes for features not included in the preview session.
 *
 * This means all routes are registered at startup, but only
 * feature-enabled routes respond to requests.
 */
const routes: FastifyPluginAsync = async (fastify) => {
  // Core routes — same structure as core backend
  await fastify.register(coreRoutes, { prefix: "/v1" });

  // Ecommerce module
  await fastify.register(async (ecommerce) => {
    await ecommerce.register(ecommerceProductRoutes, { prefix: "/products" });
    await ecommerce.register(ecommerceCartRoutes, { prefix: "/cart" });
    await ecommerce.register(ecommerceOrderRoutes, { prefix: "/orders" });
    await ecommerce.register(ecommerceReviewRoutes, { prefix: "/reviews" });
    await ecommerce.register(ecommerceSellerRoutes, { prefix: "/sellers" });
    await ecommerce.register(ecommerceCustomerRoutes, { prefix: "/customers" });
  }, { prefix: "/v1/ecommerce" });

  // LMS module
  await fastify.register(async (lms) => {
    await lms.register(lmsCourseRoutes, { prefix: "/courses" });
    await lms.register(lmsEnrollmentRoutes, { prefix: "/enrollments" });
    await lms.register(lmsLessonRoutes, { prefix: "/lessons" });
    await lms.register(lmsQuizRoutes, { prefix: "/quizzes" });
    await lms.register(lmsCertificateRoutes, { prefix: "/certificates" });
    await lms.register(lmsInstructorRoutes, { prefix: "/instructors" });
  }, { prefix: "/v1/lms" });

  // Booking module
  await fastify.register(async (booking) => {
    await booking.register(bookingServiceRoutes, { prefix: "/services" });
    await booking.register(bookingScheduleRoutes, { prefix: "/schedules" });
    await booking.register(bookingBookingRoutes, { prefix: "/bookings" });
    await booking.register(bookingProviderRoutes, { prefix: "/providers" });
    await booking.register(bookingReviewRoutes, { prefix: "/reviews" });
    await booking.register(bookingAdminRoutes, { prefix: "/admin" });
  }, { prefix: "/v1/booking" });

  // Helpdesk module
  await fastify.register(async (helpdesk) => {
    await helpdesk.register(helpdeskTicketRoutes, { prefix: "/tickets" });
    await helpdesk.register(helpdeskCategoryRoutes, { prefix: "/categories" });
    await helpdesk.register(helpdeskArticleRoutes, { prefix: "/articles" });
    await helpdesk.register(helpdeskSlaRoutes, { prefix: "/sla" });
    await helpdesk.register(helpdeskAgentRoutes, { prefix: "/agents" });
    await helpdesk.register(helpdeskCannedResponseRoutes, { prefix: "/canned-responses" });
  }, { prefix: "/v1/helpdesk" });

  // Invoicing module
  await fastify.register(async (invoicing) => {
    await invoicing.register(invoicingInvoiceRoutes, { prefix: "/invoices" });
    await invoicing.register(invoicingClientRoutes, { prefix: "/clients" });
    await invoicing.register(invoicingPaymentRoutes, { prefix: "/payments" });
    await invoicing.register(invoicingTaxRateRoutes, { prefix: "/tax-rates" });
    await invoicing.register(invoicingInvoiceItemRoutes, { prefix: "/invoice-items" });
    await invoicing.register(invoicingRecurringRoutes, { prefix: "/recurring" });
  }, { prefix: "/v1/invoicing" });

  // Events module (uses centralized index.ts)
  await fastify.register(eventsRoutes, { prefix: "/v1/events" });

  // Tasks module (uses centralized index.ts)
  await fastify.register(tasksRoutes, { prefix: "/v1/tasks" });
};

export default routes;
