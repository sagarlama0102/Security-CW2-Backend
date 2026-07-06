import { Router } from "express";
import { AdminPropertyController } from "../../controllers/admin/property.controller";
import { authorizationMiddleware, adminMiddleware } from "../../middlewares/authorization.middleware";
import { uploads } from "../../middlewares/upload.middleware";

let adminPropertyController = new AdminPropertyController();

const router = Router();

router.use(authorizationMiddleware); // apply all with middleware
router.use(adminMiddleware); // apply all with middleware

router.post("/", uploads.single("propertyImages"), adminPropertyController.createProperty);
router.get("/",adminPropertyController.getAllProperty);
router.put("/:id", uploads.single("propertyImages"), adminPropertyController.updateProperty);

router.delete("/:id", adminPropertyController.deleteProperty);
router.get("/:id", adminPropertyController.getPropertyById);

export default router;
