import { AdminBookingService } from "../../../../services/admin/booking.service";
import { BookingRepository } from "../../../../repositories/booking.repository";
import { BookingModel } from "../../../../models/booking.model";
import { BookingStatusEnum } from "../../../../types/booking.types";
import { HttpError } from "../../../../errors/http-error";

// Mock the repository and the Mongoose model
jest.mock("../../../../repositories/booking.repository");
jest.mock("../../../../models/booking.model");

describe("AdminBookingService Unit Tests", () => {
    let adminBookingService: AdminBookingService;
    const mockBookingId = "booking_123";
    const mockPropertyId = "property_456";

    beforeEach(() => {
        jest.clearAllMocks();
        adminBookingService = new AdminBookingService();
    });

    describe("getAllBookings", () => {
        test("should return all bookings with correct pagination for admin", async () => {
            const mockBookings = [{ _id: "b1" }, { _id: "b2" }];
            jest.spyOn(BookingRepository.prototype, 'getAllBooking').mockResolvedValue({
                booking: mockBookings as any,
                total: 15
            });

            const result = await adminBookingService.getAllBookings("1", "10", "PENDING");

            expect(result.booking).toHaveLength(2);
            expect(result.pagination.totalPages).toBe(2);
            expect(BookingRepository.prototype.getAllBooking).toHaveBeenCalledWith(
                1, 10, undefined, "PENDING", undefined
            );
        });
    });

    describe("updateBookingStatus", () => {
        test("should throw 404 if booking does not exist", async () => {
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(null);

            await expect(adminBookingService.updateBookingStatus(mockBookingId, BookingStatusEnum.CONFIRMED))
                .rejects
                .toThrow(new HttpError(404, "Booking not found"));
        });

        test("should allow REJECTING a booking without property collision checks", async () => {
            const mockBooking = { _id: mockBookingId, property: { _id: mockPropertyId } };
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(mockBooking as any);
            jest.spyOn(BookingRepository.prototype, 'updateBookingStatus').mockResolvedValue({ status: BookingStatusEnum.REJECTED } as any);

            const result = await adminBookingService.updateBookingStatus(mockBookingId, BookingStatusEnum.REJECTED);

            expect(result!.status).toBe(BookingStatusEnum.REJECTED);
            // Ensure BookingModel.findOne was NOT called for rejection logic
            expect(BookingModel.findOne).not.toHaveBeenCalled();
        });

        test("should throw 400 if trying to CONFIRM a property already rented to another user", async () => {
            const mockBooking = { _id: mockBookingId, property: { _id: mockPropertyId } };
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(mockBooking as any);

            // Simulate finding another confirmed booking for the same property
            (BookingModel.findOne as jest.Mock).mockResolvedValue({ _id: "other_booking" });

            await expect(adminBookingService.updateBookingStatus(mockBookingId, BookingStatusEnum.CONFIRMED))
                .rejects
                .toThrow(new HttpError(400, "Cannot confirm: This property is already rented to another user."));
        });

        test("should update status to CONFIRMED if no other booking is confirmed for that property", async () => {
            const mockBooking = { _id: mockBookingId, property: { _id: mockPropertyId } };
            jest.spyOn(BookingRepository.prototype, 'getBookingById').mockResolvedValue(mockBooking as any);
            
            // No conflict found
            (BookingModel.findOne as jest.Mock).mockResolvedValue(null);
            jest.spyOn(BookingRepository.prototype, 'updateBookingStatus').mockResolvedValue({ status: BookingStatusEnum.CONFIRMED } as any);

            const result = await adminBookingService.updateBookingStatus(mockBookingId, BookingStatusEnum.CONFIRMED);

            expect(result!.status).toBe(BookingStatusEnum.CONFIRMED);
            expect(BookingRepository.prototype.updateBookingStatus).toHaveBeenCalledWith(mockBookingId, BookingStatusEnum.CONFIRMED);
        });
    });
});