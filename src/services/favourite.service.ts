import { FavoriteRepository } from "../repositories/favourite.repository";
import { PropertyRepository } from "../repositories/property.repository";
import { HttpError } from "../errors/http-error";

// Instantiate repositories
const favoriteRepository = new FavoriteRepository();
const propertyRepository = new PropertyRepository();

export class FavoriteService {
  /**
   * Toggle a property in the user's favorites list
   */
  async toggleFavorite(propertyId: string, userId: string) {
    // 1. Check if property exists before favoriting
    const property = await propertyRepository.getPropertyById(propertyId);
    if (!property) {
      throw new HttpError(404, "Property not found");
    }

    // 2. Call repository to toggle (Create if doesn't exist, Delete if it does)
    const result = await favoriteRepository.toggleFavorite(userId, propertyId);

    return {
      success: true,
      favorited: result.favorited,
      message: result.favorited 
        ? "Property added to your favorites" 
        : "Property removed from your favorites",
    };
  }

  /**
   * Fetch all favorites for a specific user with pagination
   */
  async getMyFavorites(
    page?: string,
    size?: string,
    userId?: string
  ) {
    if (!userId) {
      throw new HttpError(401, "User ID is required");
    }

    const pageNumber = page ? parseInt(page) : 1;
    const pageSize = size ? parseInt(size) : 12;

    const { favorites, total } = await favoriteRepository.getAllFavorites(
      pageNumber,
      pageSize,
      userId
    );

    return {
      favorites,
      pagination: {
        page: pageNumber,
        size: pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Check if a specific property is favorited by the user
   */
  async checkFavoriteStatus(propertyId: string, userId: string) {
    const isFavorited = await favoriteRepository.isFavorited(userId, propertyId);
    return { isFavorited };
  }
}