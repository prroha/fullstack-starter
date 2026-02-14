import { Router } from 'express';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import commentRoutes from './comment.routes';
import labelRoutes from './label.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/labels', labelRoutes);
router.use('/settings', settingsRoutes);

export default router;
