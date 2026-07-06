import { Router } from "express";
import { PropertyController } from "../controllers/property.controller";
import { authorizationMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";

let propertyController = new PropertyController();
const router = Router();

router.get("/", propertyController.getAllProperty);
router.get("/:id", propertyController.getPropertyDetails);

export default router;