import { BookingModel, IBooking } from "../models/booking.model";
import { QueryFilter } from "mongoose";
import { BookingStatusEnum } from "../types/booking.types";

export interface IBookingRepository {
  createBooking(bookingData: Partial<IBooking>):Promise<IBooking>;
  getBookingById(id:string):Promise<IBooking | null> ;
  getAllBooking(
    page: number, size: number, search?: string, status?: string,
    userId?: string
  ): Promise<{booking: IBooking[], total: number}>;
  updateBookingStatus(id: string, status: BookingStatusEnum): Promise<IBooking | null>;
  findActiveBooking(userId: string, propertyId: string): Promise<IBooking | null>;
}

export class BookingRepository implements IBookingRepository{
  async updateBookingStatus(id: string, status: BookingStatusEnum): Promise<IBooking | null> {
    return await BookingModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
  }
  async findActiveBooking(userId: string, propertyId: string): Promise<IBooking | null> {
    return await BookingModel.findOne({
      user: userId,
      property: propertyId,
      status: { $in: [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED] }
    });
  }
  async createBooking(bookingData: Partial<IBooking>): Promise<IBooking> {
    const booking = new BookingModel(bookingData);
    return await booking.save();
  }
  async getBookingById(id: string): Promise<IBooking | null> {
    return await BookingModel.findById(id)
    .populate("property")
    .populate("user", "name email");
  }
  async getAllBooking(
    page: number, size: number, search?: string,status?: string, userId?:string
  ): 
  Promise<{ booking: IBooking[]; total: number; }> {
    const filter:QueryFilter<IBooking> = {};
    if (status) {
      filter.status = status;
    }
    if (userId) {
      filter.user = userId;
    }

    const [booking, total] = await Promise.all([
      BookingModel.find(filter)
        .populate("property")
        .populate("user", "firstName lastName email profilePicture name username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
      BookingModel.countDocuments(filter),
    ]);

    return { booking, total };

  }
  
}