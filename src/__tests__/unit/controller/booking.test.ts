import { BookingController } from "../../../controllers/booking.controller";
import { BookingService } from "../../../services/booking.service";
import { CreateBookingDTO } from "../../../dtos/booking.dto";
import { Request, Response } from "express";
import mongoose from "mongoose";

// 1. Mock the Service Layer
jest.mock("../../../services/booking.service");

describe("BookingController Unit Tests", () => {
    let bookingController: BookingController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
        bookingController = new BookingController();

        // Standard Express Response Mock with chaining
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("createBooking", () => {
        const validBookingBody = {
            property: new mongoose.Types.ObjectId().toString(),
            message: "I'd like to book this place."
        };

        test("should return 201 if booking is created successfully", async () => {
            req = {
                user: { _id: mockUserId } as any,
                body: validBookingBody
            };

            const mockSavedBooking = { _id: "booking123", ...validBookingBody, user: mockUserId };
            
            // Mocking the Zod safeParse success (Assuming CreateBookingDTO is a Zod schema)
            // If CreateBookingDTO is just a class/type, ensure the controller can access it
            jest.spyOn(BookingService.prototype, 'createBooking').mockResolvedValue(mockSavedBooking as any);

            await bookingController.createBooking(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Booking request created successfully"
            }));
        });

        test("should return 401 if userId is missing from request", async () => {
            req = { user: undefined, body: validBookingBody };

            await bookingController.createBooking(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "User context not found"
            }));
        });

        test("should return 400 if Zod validation fails", async () => {
            req = {
                user: { _id: mockUserId } as any,
                body: { property: "invalid-id" } // Missing message, invalid ID
            };

            await bookingController.createBooking(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
    });

    describe("getMyBookings", () => {
        test("should return 200 and list of bookings", async () => {
            req = {
                user: { _id: mockUserId } as any,
                query: { page: "1", size: "10" }
            };

            const mockResult = {
                booking: [{ _id: "b1" }],
                pagination: { page: 1, size: 10, totalItems: 1, totalPages: 1 }
            };

            jest.spyOn(BookingService.prototype, 'getAllBooking').mockResolvedValue(mockResult as any);

            await bookingController.getMyBookings(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockResult.booking
            }));
        });
    });

    describe("cancelBooking", () => {
        test("should return 200 on successful cancellation", async () => {
            const bookingId = "booking123";
            req = {
                user: { _id: mockUserId } as any,
                params: { id: bookingId }
            };

            jest.spyOn(BookingService.prototype, 'cancelBooking').mockResolvedValue({ _id: bookingId, status: "CANCELLED" } as any);

            await bookingController.cancelBooking(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Booking cancelled successfully"
            }));
        });

        test("should catch and return service errors (e.g., 403 Forbidden)", async () => {
            req = {
                user: { _id: mockUserId } as any,
                params: { id: "not-mine" }
            };

            jest.spyOn(BookingService.prototype, 'cancelBooking').mockRejectedValue({
                statusCode: 403,
                message: "You are not authorized to cancel this booking"
            });

            await bookingController.cancelBooking(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "You are not authorized to cancel this booking"
            }));
        });
    });
});