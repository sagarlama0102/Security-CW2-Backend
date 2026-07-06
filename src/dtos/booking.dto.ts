import z from "zod";
import { BookingSchema } from "../types/booking.types";

export const CreateBookingDTO = BookingSchema.pick({
  property: true,
  message: true,
}).extend({

  user: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID"),
});

export type CreateBookingDTO = z.infer<typeof CreateBookingDTO>;

export const CancelBookingDTO = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Booking ID"),
});

export type CancelBookingDTO = z.infer<typeof CancelBookingDTO>;