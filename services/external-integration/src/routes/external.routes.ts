import { Router } from 'express';
import { externalController } from '../controllers/external.controller';

const router = Router();

// Get available external systems
router.get('/systems', externalController.getAvailableSystems.bind(externalController));

// Forward report to external system
router.post('/forward', externalController.forwardReport.bind(externalController));

// Get forwards by report
router.get('/reports/:reportId/forwards', externalController.getForwardsByReport.bind(externalController));

// Get forward status
router.get('/forwards/:forwardId', externalController.getForwardStatus.bind(externalController));

// Webhook endpoints for external systems
router.post('/webhooks/:source', externalController.handleWebhook.bind(externalController));

export { router as externalRoutes };
