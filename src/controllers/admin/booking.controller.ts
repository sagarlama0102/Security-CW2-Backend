import { NextFunction, Request, Response } from "express";
import { AdminBookingService } from "../../services/admin/booking.service";
import { BookingStatusEnum } from "../../types/booking.types";
import { QueryParams } from "../../types/query.type";
import z from "zod";

let adminBookingService = new AdminBookingService();

export class AdminBookingController {
    /**
     * Admin: Fetch all bookings across the platform
     */
    async getAllBookings(req: Request, res: Response) {
        try {
            const { page, size, status }: QueryParams & { status?: string } = req.query;

            const { booking, pagination } = await adminBookingService.getAllBookings(
                page,
                size,
                status
            );

            return res.status(200).json({
                success: true,
                data: booking,
                pagination: pagination,
                message: "All bookings fetched successfully"
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    /**
     * Admin: Update booking status (Confirm or Reject)
     * URL: PATCH /api/admin/bookings/:id/status
     */
    async updateBookingStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const bookingId = req.params.id;
            const { status } = req.body;

            // Simple validation for the status enum
            if (!Object.values(BookingStatusEnum).includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${Object.values(BookingStatusEnum).join(", ")}`
                });
            }

            const updatedBooking = await adminBookingService.updateBookingStatus(
                bookingId,
                status as BookingStatusEnum
            );

            return res.status(200).json({
                success: true,
                message: `Booking has been ${status.toLowerCase()}`,
                data: updatedBooking
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}