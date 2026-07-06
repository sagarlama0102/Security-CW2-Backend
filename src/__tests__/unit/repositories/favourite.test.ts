import { FavoriteRepository } from "../../../repositories/favourite.repository";
import { FavoriteModel } from "../../../models/favourite.model";
import { PropertyModel } from "../../../models/property.model";
import { PropertyTypeEnum } from "../../../types/property.type";
import mongoose from "mongoose";

describe("FavoriteRepository Integration Tests", () => {
  let favoriteRepository: FavoriteRepository;
  const mockUserId = new mongoose.Types.ObjectId().toString();
  let mockPropertyId: string;

  beforeAll(() => {
    favoriteRepository = new FavoriteRepository();
  });

  beforeEach(async () => {
    // Create a property to favorite
    const property = await PropertyModel.create({
      title: "Favorite-able House",
      description: "A very nice description that is at least twenty characters long.",
      propertyType: PropertyTypeEnum.HOUSE,
      bhk: "3BHK",
      price: 2500,
      address: "Fav Street 1",
      city: "Kathmandu",
      propertyImages: ["fav.png"]
    });
    mockPropertyId = property._id.toString();
  });

  afterEach(async () => {
    await FavoriteModel.deleteMany({});
    await PropertyModel.deleteMany({});
  });

  describe("toggleFavorite", () => {
    test("should add a favorite if it doesn't exist", async () => {
      const result = await favoriteRepository.toggleFavorite(mockUserId, mockPropertyId);

      expect(result.favorited).toBe(true);
      const doc = await FavoriteModel.findOne({ user: mockUserId, property: mockPropertyId });
      expect(doc).not.toBeNull();
    });

    test("should remove a favorite if it already exists (toggle off)", async () => {
      // First, manually create a favorite
      await FavoriteModel.create({ user: mockUserId, property: mockPropertyId });

      // Second, call toggle
      const result = await favoriteRepository.toggleFavorite(mockUserId, mockPropertyId);

      expect(result.favorited).toBe(false);
      const doc = await FavoriteModel.findOne({ user: mockUserId, property: mockPropertyId });
      expect(doc).toBeNull();
    });
  });

  describe("isFavorited", () => {
    test("should return true if record exists", async () => {
      await FavoriteModel.create({ user: mockUserId, property: mockPropertyId });
      const result = await favoriteRepository.isFavorited(mockUserId, mockPropertyId);
      expect(result).toBe(true);
    });

    test("should return false if record does not exist", async () => {
      const result = await favoriteRepository.isFavorited(mockUserId, "659d1a3c5f1a2b3c4d5e6f7a");
      expect(result).toBe(false);
    });
  });

  describe("getAllFavorites", () => {
    test("should return favorites with populated property details", async () => {
      await FavoriteModel.create({ user: mockUserId, property: mockPropertyId });

      const { favorites, total } = await favoriteRepository.getAllFavorites(1, 10, mockUserId);

      expect(total).toBe(1);
      expect(favorites[0].property).toHaveProperty("title", "Favorite-able House");
      // This verifies that .populate("property") worked
      expect((favorites[0].property as any).city).toBe("Kathmandu");
    });

    test("should only return favorites belonging to the specific user", async () => {
      const otherUser = new mongoose.Types.ObjectId().toString();
      await FavoriteModel.create({ user: otherUser, property: mockPropertyId });

      const { total } = await favoriteRepository.getAllFavorites(1, 10, mockUserId);
      expect(total).toBe(0); // Should not see the other user's favorites
    });
  });
});