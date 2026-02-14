import { Router } from 'express';
import eventRoutes from './event.routes';
import venueRoutes from './venue.routes';
import registrationRoutes from './registration.routes';
import speakerRoutes from './speaker.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/events', eventRoutes);
router.use('/venues', venueRoutes);
router.use('/registrations', registrationRoutes);
router.use('/speakers', speakerRoutes);
router.use('/settings', settingsRoutes);

export default router;
