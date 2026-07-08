import { Router } from 'express';
import { MFAController } from '../controllers/mfa.controller';
import { authorizationMiddleware } from '../middlewares/authorization.middleware';

const router = Router();
const mfaController = new MFAController();

// all MFA routes require authentication
router.post('/setup', authorizationMiddleware, mfaController.setupMFA);
router.post('/verify-enable', authorizationMiddleware, mfaController.verifyAndEnableMFA);
router.post('/verify', authorizationMiddleware, mfaController.verifyMFAToken);
router.post('/disable', authorizationMiddleware, mfaController.disableMFA);

export default router;