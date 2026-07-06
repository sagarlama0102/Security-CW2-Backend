import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizationMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";
import { authLimiter, passwordResetLimiter, generalLimiter } from "../middlewares/rate-limit.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

router.get("/whoami", authorizationMiddleware, authController.getProfile);
router.put(
    '/update-profile',
    authorizationMiddleware,
    uploads.single("profilePicture"),
    authController.updateProfile
);

router.post("/request-password-reset", passwordResetLimiter, authController.sendResetPasswordEmail);
router.post("/reset-password/:token", passwordResetLimiter, authController.resetPassword);

export default router;