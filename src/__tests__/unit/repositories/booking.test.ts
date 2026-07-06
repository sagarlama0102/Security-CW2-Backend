import { BookingRepository } from "../../../repositories/booking.repository";
import { BookingModel } from "../../../models/booking.model";
import { PropertyModel } from "../../../models/property.model";
import { UserModel } from "../../../models/user.model";
import { BookingStatusEnum } from "../../../types/booking.types";
import { PropertyTypeEnum } from "../../../types/property.type";
import mongoose from "mongoose";

describe("BookingRepository Integration Tests", () => {
  let bookingRepository: BookingRepository;
  let testUser: any;
  let testProperty: any;

  beforeAll(async () => {
    bookingRepository = new BookingRepository();
  });

  beforeEach(async () => {
    // 1. Create a real User to link
    testUser = await UserModel.create({
      firstName: "John",
      lastName: "Doe",
      email: `test-${Date.now()}@example.com`,
      password: "Password123!",
      username: `user-${Date.now()}`
    });

    // 2. Create a real Property to link
    testProperty = await PropertyModel.create({
      title: "Test Apartment for Booking",
      description: "This is a long enough description for the property listing.",
      propertyType: PropertyTypeEnum.APARTMENT,
      bhk: "2BHK",
      price: 1200,
      address: "123 Test Lane",
      city: "Kathmandu",
      propertyImages: ["image.png"]
    });
  });

  afterEach(async () => {
    await BookingModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  describe("createBooking", () => {
    test("should save a booking correctly", async () => {
      const bookingData = {
        property: testProperty._id,
        user: testUser._id,
        status: BookingStatusEnum.PENDING,
        message: "Interested in this flat."
      };

      const savedBooking = await bookingRepository.createBooking(bookingData as any);
      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.status).toBe(BookingStatusEnum.PENDING);
    });
  });

  describe("findActiveBooking", () => {
    test("should find a PENDING booking as active", async () => {
      await BookingModel.create({
        property: testProperty._id,
        user: testUser._id,
        status: BookingStatusEnum.PENDING
      });

      const active = await bookingRepository.findActiveBooking(
        testUser._id.toString(),
        testProperty._id.toString()
      );

      expect(active).not.toBeNull();
      expect(active?.status).toBe(BookingStatusEnum.PENDING);
    });

    test("should return null if the existing booking is CANCELLED", async () => {
      await BookingModel.create({
        property: testProperty._id,
        user: testUser._id,
        status: BookingStatusEnum.CANCELLED
      });

      const active = await bookingRepository.findActiveBooking(
        testUser._id.toString(),
        testProperty._id.toString()
      );

      expect(active).toBeNull();
    });
  });

  describe("getBookingById with Populate", () => {
    test("should return booking with populated property and user", async () => {
      const created = await BookingModel.create({
        property: testProperty._id,
        user: testUser._id,
        status: BookingStatusEnum.CONFIRMED
      });

      const booking = await bookingRepository.getBookingById(created._id.toString());

      expect(booking).not.toBeNull();
      // Verify Populate worked
      expect(booking?.property).toHaveProperty("title", "Test Apartment for Booking");
      expect(booking?.user).toHaveProperty("email", testUser.email);
    });
  });

  describe("updateBookingStatus", () => {
    test("should update status to CONFIRMED", async () => {
      const created = await BookingModel.create({
        property: testProperty._id,
        user: testUser._id,
        status: BookingStatusEnum.PENDING
      });

      const updated = await bookingRepository.updateBookingStatus(
        created._id.toString(),
        BookingStatusEnum.CONFIRMED
      );

      expect(updated?.status).toBe(BookingStatusEnum.CONFIRMED);
    });
  });
});