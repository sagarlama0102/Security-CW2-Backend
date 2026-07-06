import { BookingService } from "../../../services/booking.service";
import { BookingRepository } from "../../../repositories/booking.repository";
import { PropertyRepository } from "../../../repositories/property.repository";
import { BookingStatusEnum } from "../../../types/booking.types";
import { HttpError } from "../../../errors/http-error";
import mongoose from "mongoose";

// Mock the Repositories
jest.mock("../../../repositories/booking.repository");
jest.mock("../../../repositories/property.repository");

describe("BookingService Unit Tests", () => {
    let bookingService: BookingService;
    const mockUserId = new mongoose.Types.ObjectId().toString();
    const mockPropertyId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        bookingService = new BookingService();
    });

    describe("createBooking", () => {
        const createData = {
            property: mockPropertyId,
            user: mockUserId,
            message: "I want to rent this!"
        };

        test("should throw 404 if property does not exist", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(null);

            await expect(bookingService.createBooking(createData as any))
                .rejects
                .toThrow(new HttpError(404, "Property not found"));
        });

        test("should throw 400 if user already has an active booking for this property", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue({ _id: mockPropertyId } as any);
            // Simulate finding an existing PENDING booking
            jest.spyOn(BookingRepository.prototype, 'findActiveBooking').mockResolvedValue({ _id: "existing123" } as any);

            await expect(bookingService.createBooking(createData as any))
                .rejects
                .toThrow(new HttpError(400, "You already have a pending or confirmed booking for this property"));
        });

        test("should create booking if all validations pass", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue({ _id: mockPropertyId } as any);
            jest.spyOn(BookingRepository.prototype, 'findActiveBooking').mockResolvedValue(null);
            jest.spyOn(BookingRepository.prototype, 'createBooking').mockResolvedValue({ _id: "newBookingId", ...createData } as any);

            const result = await bookingService.createBooking(createData as any);

            expect(result).toHaveProperty("_id", "newBookingId");
            expect(BookingRepository.prototype.createBooking).toHaveBeenCalledWith(createData);
        });
    });

    describe("cancelBooking", () => {
        const mockBookingId = new mongoose.Types.ObjectId().toString();

        test("should throw 404 if booking is not found", async () => {
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(null);

            await expect(bookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects
                .toThrow(new HttpError(404, "Booking not found"));
        });

        test("should throw 403 if user tries to cancel someone else's booking", async () => {
            const foreignBooking = {
                _id: mockBookingId,
                user: "differentUserId", // Not matching mockUserId
                status: BookingStatusEnum.PENDING
            };
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(foreignBooking as any);

            await expect(bookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects
                .toThrow(new HttpError(403, "You are not authorized to cancel this booking"));
        });

        test("should throw 400 if booking status is not PENDING (e.g., CONFIRMED)", async () => {
            const confirmedBooking = {
                _id: mockBookingId,
                user: mockUserId,
                status: BookingStatusEnum.CONFIRMED
            };
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(confirmedBooking as any);

            await expect(bookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects
                .toThrow(new HttpError(400, `Cannot cancel a booking that is already ${BookingStatusEnum.CONFIRMED}`));
        });

        test("should successfully update status to CANCELLED", async () => {
    const validBooking = {
        _id: mockBookingId,
        user: mockUserId,
        status: BookingStatusEnum.PENDING
    };
    
    jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(validBooking as any);
    jest.spyOn(BookingRepository.prototype, 'updateBookingStatus').mockResolvedValue({ 
        ...validBooking, 
        status: BookingStatusEnum.CANCELLED 
    } as any);

    const result = await bookingService.cancelBooking(mockBookingId, mockUserId);

    // Use the '!' operator to tell TS "I promise this isn't null"
    expect(result!.status).toBe(BookingStatusEnum.CANCELLED); 
    expect(BookingRepository.prototype.updateBookingStatus).toHaveBeenCalledWith(
        mockBookingId, 
        BookingStatusEnum.CANCELLED
    );
});
    });
});