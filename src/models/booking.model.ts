import mongoose, { Document, Schema } from "mongoose";
import { BookingType, BookingStatusEnum } from "../types/booking.types";

// Note: Use Schema.Types.ObjectId for relational linking
const BookingSchema: Schema = new Schema(
  {
    property: { 
      type: Schema.Types.ObjectId, 
      ref: "Property", // Name of your Property model
      required: true 
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", // Name of your User model
      required: true 
    },
    status: {
      type: String,
      enum: Object.values(BookingStatusEnum),
      default: BookingStatusEnum.PENDING, // Default to PENDING
      required: true,
    },
    message: { type: String, required: false }, // Made optional to match your DTO
  },
  {
    timestamps: true,
  }
);

// This interface helps TypeScript understand the MongoDB document
export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId; // Better for Mongoose internal logic
  user: mongoose.Types.ObjectId;
  status: BookingStatusEnum;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  
}

export const BookingModel = mongoose.model<IBooking>("Bookings", BookingSchema);