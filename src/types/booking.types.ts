import z from "zod";

export enum BookingStatusEnum{
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

export const BookingSchema = z.object({
    _id:z.string(),
    property:z.string().regex(/^[0-9a-fA-F]{24}$/,"Invalid Property ID"), //property Id
    user:z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID"), //user Id
    status:z.nativeEnum(BookingStatusEnum).default(BookingStatusEnum.PENDING),
    message:z.string().max(500, "Message is too long").optional(),
});

export type BookingType = z.infer<typeof BookingSchema>;

