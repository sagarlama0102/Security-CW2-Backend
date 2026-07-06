import { BookingRepository } from "../repositories/booking.repository";
import { PropertyRepository } from "../repositories/property.repository";
import { CreateBookingDTO } from "../dtos/booking.dto";
import { BookingStatusEnum } from "../types/booking.types";
import { HttpError } from "../errors/http-error";

// Instantiate repositories
const bookingRepository = new BookingRepository();
const propertyRepository = new PropertyRepository();

export class BookingService {
  /**
   * Create a new booking request
   */
  async createBooking(data: CreateBookingDTO) {
    // 1. Check if property exists
    const property = await propertyRepository.getPropertyById(data.property);
    if (!property) {
      throw new HttpError(404, "Property not found");
    }

    // 2. Prevent duplicate active bookings (Pending/Confirmed) by the same user
    const existingBooking = await bookingRepository.findActiveBooking(
      data.user,
      data.property
    );
    if (existingBooking) {
      throw new HttpError(
        400,
        "You already have a pending or confirmed booking for this property"
      );
    }

    // 3. Save to database
    return await bookingRepository.createBooking(data as any);
  }

  /**
   * Fetch all bookings for a specific user with pagination
   */
  async getAllBooking(
    page?: string,
    size?: string,
    search?: string,
    status?: string,
    userId?: string
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const pageSize = size ? parseInt(size) : 12;

    // Corrected the order of arguments to match: 
    // getAllBooking(page, size, search, status, userId)
    const { booking, total } = await bookingRepository.getAllBooking(
      pageNumber,
      pageSize,
      search,
      status,
      userId
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
   * Cancel a booking (User-initiated)
   */
  async cancelBooking(bookingId: string, userId: string) {
    const booking = await bookingRepository.getBookingById(bookingId);

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    // Security: Validate that the user owns this booking
    // Using string conversion to ensure safe comparison
    const ownerId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    if (ownerId !== userId) {
      throw new HttpError(403, "You are not authorized to cancel this booking");
    }

    // Logic: Only allow cancellation if the request hasn't been processed yet
    if (booking.status !== BookingStatusEnum.PENDING) {
      throw new HttpError(
        400,
        `Cannot cancel a booking that is already ${booking.status}`
      );
    }

    // Update the record to CANCELLED
    return await bookingRepository.updateBookingStatus(
      bookingId,
      BookingStatusEnum.CANCELLED
    );
  }
}