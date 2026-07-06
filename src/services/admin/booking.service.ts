import { BookingRepository } from "../../repositories/booking.repository";
import { BookingStatusEnum } from "../../types/booking.types";
import { HttpError } from "../../errors/http-error";
import { BookingModel } from "../../models/booking.model"; // Import model for direct check

const bookingRepository = new BookingRepository();

export class AdminBookingService {
  /**
   * Fetch all bookings for the Admin Dashboard
   */
  async getAllBookings(page?: string, size?: string, status?: string) {
    const pageNumber = page ? parseInt(page) : 1;
    const pageSize = size ? parseInt(size) : 10;

    // We pass undefined for search and userId so the admin sees everything
    const { booking, total } = await bookingRepository.getAllBooking(
      pageNumber,
      pageSize,
      undefined,
      status,
      undefined
    );

    return {
      booking,
      pagination: {
        page: pageNumber,
        size: pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Admin decides to Confirm or Reject a booking
   */
  async updateBookingStatus(bookingId: string, status: BookingStatusEnum) {
    // 1. Check if the booking exists
    const booking = await bookingRepository.getBookingById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    // 2. Logic for CONFIRMING: Check if the house is already taken by someone else
    if (status === BookingStatusEnum.CONFIRMED) {
      const alreadyConfirmed = await BookingModel.findOne({
        property: booking.property._id,
        status: BookingStatusEnum.CONFIRMED,
        _id: { $ne: bookingId }, // Don't check against itself
      });

      if (alreadyConfirmed) {
        throw new HttpError(
          400,
          "Cannot confirm: This property is already rented to another user."
        );
      }
    }

    // 3. Update the status
    return await bookingRepository.updateBookingStatus(bookingId, status);
  }
}