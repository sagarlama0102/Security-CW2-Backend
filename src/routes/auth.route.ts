import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizationMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";
import { authLimiter, passwordResetLimiter, generalLimiter } from "../middlewares/rate-limit.middleware";
import { passwordPolicyMiddleware } from "../middlewares/password-policy.middleware";
import { verifyCaptcha } from "../middlewares/captcha.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authLimiter,verifyCaptcha, passwordPolicyMiddleware, authController.register);
router.post("/login", authLimiter,verifyCaptcha, authController.login);
router.post("/verify-mfa-login", authLimiter, authController.verifyMFALogin);

router.get("/whoami", authorizationMiddleware, authController.getProfile);
router.put(
    '/update-profile',
    authorizationMiddleware,
    uploads.single("profilePicture"),
    authController.updateProfile
);

router.post("/request-password-reset", passwordResetLimiter, authController.sendResetPasswordEmail);
router.post("/reset-password/:token", passwordResetLimiter, authController.resetPassword);

router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authorizationMiddleware, authController.logout);

router.get("/export-data", authorizationMiddleware, authController.exportData);
router.post("/import-data", authorizationMiddleware, authController.importData);

export default router;