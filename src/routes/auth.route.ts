import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizationMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)
// add remaning routes like login, logout, etc.

router.get("/whoami", authorizationMiddleware, authController.getProfile);
router.put(
    '/update-profile',
    authorizationMiddleware,
    uploads.single("profilePicture"), // "image"-fields name from frontend/client
    authController.updateProfile
)

router.post("/request-password-reset", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

export default router;