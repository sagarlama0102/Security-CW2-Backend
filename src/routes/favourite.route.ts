import { Router } from "express";
import { FavoriteController } from "../controllers/favourite.controller";
import { authorizationMiddleware } from "../middlewares/authorization.middleware";

const router = Router();
const favouriteController = new FavoriteController();

router.post(
  "/toggle", 
  authorizationMiddleware, 
  favouriteController.toggleFavorite
);

// Get User Wishlist: GET /api/favourites/my-wishlist
// Supports query params: ?page=1&size=12
router.get(
  "/my-wishlist", 
  authorizationMiddleware, 
  favouriteController.getMyFavorites
);

// Check Status: GET /api/favourites/status/:propertyId
// Used to check if a specific property is already favorited by the user
router.get(
  "/status/:propertyId", 
  authorizationMiddleware, 
  favouriteController.checkStatus
);

export default router;