import { FavoriteService } from "../../../services/favourite.service";
import { FavoriteRepository } from "../../../repositories/favourite.repository";
import { PropertyRepository } from "../../../repositories/property.repository";
import { HttpError } from "../../../errors/http-error";

// Mock the Repositories
jest.mock("../../../repositories/favourite.repository");
jest.mock("../../../repositories/property.repository");

describe("FavoriteService Unit Tests", () => {
    let favoriteService: FavoriteService;
    const mockUserId = "user123";
    const mockPropertyId = "prop123";

    beforeEach(() => {
        jest.clearAllMocks();
        favoriteService = new FavoriteService();
    });

    describe("toggleFavorite", () => {
        test("should throw 404 if property does not exist", async () => {
            // Mock property search to return null
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(null);

            await expect(favoriteService.toggleFavorite(mockPropertyId, mockUserId))
                .rejects
                .toThrow(new HttpError(404, "Property not found"));
        });

        test("should return 'added' message when property is favorited", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue({ _id: mockPropertyId } as any);
            // Mock repo to return favorited: true
            jest.spyOn(FavoriteRepository.prototype, 'toggleFavorite').mockResolvedValue({ favorited: true });

            const result = await favoriteService.toggleFavorite(mockPropertyId, mockUserId);

            expect(result.favorited).toBe(true);
            expect(result.message).toBe("Property added to your favorites");
        });

        test("should return 'removed' message when property is unfavorited", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue({ _id: mockPropertyId } as any);
            // Mock repo to return favorited: false
            jest.spyOn(FavoriteRepository.prototype, 'toggleFavorite').mockResolvedValue({ favorited: false });

            const result = await favoriteService.toggleFavorite(mockPropertyId, mockUserId);

            expect(result.favorited).toBe(false);
            expect(result.message).toBe("Property removed from your favorites");
        });
    });

    describe("getMyFavorites", () => {
        test("should throw 401 if userId is not provided", async () => {
            await expect(favoriteService.getMyFavorites("1", "12", undefined))
                .rejects
                .toThrow(new HttpError(401, "User ID is required"));
        });

        test("should return paginated favorites", async () => {
            const mockFavorites = [{ _id: "fav1", property: { title: "House" } }];
            jest.spyOn(FavoriteRepository.prototype, 'getAllFavorites').mockResolvedValue({
                favorites: mockFavorites as any,
                total: 1
            });

            const result = await favoriteService.getMyFavorites("1", "10", mockUserId);

            expect(result.favorites).toHaveLength(1);
            expect(result.pagination.totalPages).toBe(1);
            expect(FavoriteRepository.prototype.getAllFavorites).toHaveBeenCalledWith(1, 10, mockUserId);
        });
    });

    describe("checkFavoriteStatus", () => {
        test("should return the status from repository", async () => {
            jest.spyOn(FavoriteRepository.prototype, 'isFavorited').mockResolvedValue(true);

            const result = await favoriteService.checkFavoriteStatus(mockPropertyId, mockUserId);

            expect(result.isFavorited).toBe(true);
            expect(FavoriteRepository.prototype.isFavorited).toHaveBeenCalledWith(mockUserId, mockPropertyId);
        });
    });
});