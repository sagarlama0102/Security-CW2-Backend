import { Router } from "express";
import { AdminBookingController } from "../../controllers/admin/booking.controller";
import { adminMiddleware, authorizationMiddleware } from "../../middlewares/authorization.middleware";

const router = Router();
const adminBookingController = new AdminBookingController();

/**
 * All routes here are prefixed with /api/admin/bookings (or similar)
 * and are protected by Admin security layers.
 */

// 1. Get all bookings with pagination and status filters
router.get(
    "/", 
    authorizationMiddleware, 
    adminMiddleware, 
    adminBookingController.getAllBookings
);

// 2. Update booking status (Confirm or Reject)
// We use PATCH because we are only updating the 'status' field of the booking
router.patch(
    "/:id/status", 
    authorizationMiddleware, 
    adminMiddleware, 
    adminBookingController.updateBookingStatus
);

export default router;