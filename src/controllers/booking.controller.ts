import { NextFunction, Request, Response } from "express";
import { BookingService } from "../services/booking.service";
import { CreateBookingDTO } from "../dtos/booking.dto";
import z from "zod";
import { QueryParams } from "../types/query.type";

const bookingService = new BookingService();

export class BookingController {

    async createBooking(req: Request, res: Response) {
        try {
            // Your middleware attaches the user object here
            const userId = req.user?._id; 

            if (!userId) {
                return res.status(401).json({ success: false, message: "User context not found" });
            }

            // Validate data and inject the authenticated user ID
            const parsedData = CreateBookingDTO.safeParse({
                ...req.body,
                user: userId.toString() 
            });

            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const newBooking = await bookingService.createBooking(parsedData.data as any);

            return res.status(201).json({
                success: true,
                message: "Booking request created successfully",
                data: newBooking
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async getMyBookings(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            const { page, size, status, search }: QueryParams & { status?: string } = req.query;

            const result = await bookingService.getAllBooking(
                page,
                size,
                search,
                status,
                userId
            );

            return res.status(200).json({
                success: true,
                data: result.booking,
                pagination: result.pagination,
                message: "Your bookings fetched successfully"
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    /**
     * User: Cancel a booking
     * Logic: Service verifies if the booking actually belongs to this userId
     */
    async cancelBooking(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            const bookingId = req.params.id;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const updatedBooking = await bookingService.cancelBooking(bookingId, userId);

            return res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                data: updatedBooking
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}