import { FastifyPluginAsync } from 'fastify';
import eventRoutes from './event.routes.js';
import venueRoutes from './venue.routes.js';
import registrationRoutes from './registration.routes.js';
import speakerRoutes from './speaker.routes.js';
import settingsRoutes from './settings.routes.js';

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(eventRoutes, { prefix: '/events' });
  await fastify.register(venueRoutes, { prefix: '/venues' });
  await fastify.register(registrationRoutes, { prefix: '/registrations' });
  await fastify.register(speakerRoutes, { prefix: '/speakers' });
  await fastify.register(settingsRoutes, { prefix: '/settings' });
};

export default routes;
