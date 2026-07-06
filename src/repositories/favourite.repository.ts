import { FavoriteModel, IFavorite } from "../models/favourite.model";
import { QueryFilter } from "mongoose";

export interface IFavoriteRepository {
  toggleFavorite(userId: string, propertyId: string): Promise<{ favorited: boolean }>;
  isFavorited(userId: string, propertyId: string): Promise<boolean>;
  getAllFavorites(
    page: number, 
    size: number, 
    userId: string
  ): Promise<{ favorites: IFavorite[], total: number }>;
}

export class FavoriteRepository implements IFavoriteRepository {

  async toggleFavorite(userId: string, propertyId: string): Promise<{ favorited: boolean }> {
    const existing = await FavoriteModel.findOne({
      user: userId,
      property: propertyId,
    });

    if (existing) {
      await FavoriteModel.findByIdAndDelete(existing._id);
      return { favorited: false };
    } else {
      const favorite = new FavoriteModel({
        user: userId,
        property: propertyId,
      });
      await favorite.save();
      return { favorited: true };
    }
  }

  async isFavorited(userId: string, propertyId: string): Promise<boolean> {
    const result = await FavoriteModel.exists({
      user: userId,
      property: propertyId,
    });
    return !!result;
  }

  async getAllFavorites(
    page: number, 
    size: number, 
    userId: string
  ): Promise<{ favorites: IFavorite[]; total: number; }> {
    const filter: QueryFilter<IFavorite> = { user: userId };

    const [favorites, total] = await Promise.all([
      FavoriteModel.find(filter)
        .populate("property") // Brings in full house details for the cards
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
      FavoriteModel.countDocuments(filter),
    ]);

    return { favorites, total };
  }
}