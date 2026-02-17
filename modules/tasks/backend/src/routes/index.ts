import { FastifyPluginAsync } from 'fastify';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import commentRoutes from './comment.routes.js';
import labelRoutes from './label.routes.js';
import settingsRoutes from './settings.routes.js';

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(projectRoutes, { prefix: '/projects' });
  await fastify.register(taskRoutes, { prefix: '/tasks' });
  await fastify.register(commentRoutes, { prefix: '/comments' });
  await fastify.register(labelRoutes, { prefix: '/labels' });
  await fastify.register(settingsRoutes, { prefix: '/settings' });
};

export default routes;
