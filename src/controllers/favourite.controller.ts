import { Request, Response } from "express";
import { FavoriteService } from "../services/favourite.service";
import { CreateFavouriteDTO } from "../dtos/favourite.dto";
import { QueryParams } from "../types/query.type";

const favoriteService = new FavoriteService();

export class FavoriteController {
    /**
     * User: Toggle Favourite (Add or Remove)
     * Logic: Uses the authenticated userId to either create or delete a favorite record
     */
    async toggleFavorite(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            const { propertyId } = req.body; // Expecting { "propertyId": "..." }

            if (!userId) {
                return res.status(401).json({ success: false, message: "User context not found" });
            }

            // Validate the data using your DTO
            const parsedData = CreateFavouriteDTO.safeParse({
                property: propertyId,
                user: userId.toString()
            });

            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Property ID or User ID"
                });
            }

            // Call the service which handles the toggle logic
            const result = await favoriteService.toggleFavorite(
                parsedData.data.property,
                parsedData.data.user
            );

            return res.status(200).json(result);

        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    /**
     * User: Get "My Wishlist"
     * Logic: Returns all properties favorited by the logged-in user
     */
    async getMyFavorites(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            const { page, size }: QueryParams = req.query;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const result = await favoriteService.getMyFavorites(
                page as string,
                size as string,
                userId
            );

            return res.status(200).json({
                success: true,
                data: result.favorites,
                pagination: result.pagination,
                message: "Wishlist fetched successfully"
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    /**
     * User: Check if a property is favorited
     * Useful for the frontend to determine heart color on page load
     */
    async checkStatus(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            const propertyId = req.params.propertyId;

            if (!userId) return res.status(401).json({ success: false });

            const result = await favoriteService.checkFavoriteStatus(propertyId, userId);

            return res.status(200).json({
                success: true,
                isFavorited: result.isFavorited
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}