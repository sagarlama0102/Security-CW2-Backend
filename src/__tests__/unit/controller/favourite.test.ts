import { FavoriteController } from "../../../controllers/favourite.controller";
import { FavoriteService } from "../../../services/favourite.service";
import { Request, Response } from "express";
import mongoose from "mongoose";

// Mock the FavoriteService
jest.mock("../../../services/favourite.service");

describe("FavoriteController Unit Tests", () => {
    let favoriteController: FavoriteController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId();
    const mockPropertyId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        favoriteController = new FavoriteController();

        // Mock Express Response
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("toggleFavorite", () => {
        test("should return 200 and toggle result on success", async () => {
            req = {
                user: { _id: mockUserId } as any,
                body: { propertyId: mockPropertyId }
            };

            const mockServiceResponse = {
                success: true,
                favorited: true,
                message: "Property added to your favorites"
            };

            jest.spyOn(FavoriteService.prototype, 'toggleFavorite').mockResolvedValue(mockServiceResponse);

            await favoriteController.toggleFavorite(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
        });

        test("should return 401 if user context is missing", async () => {
            req = { user: undefined, body: { propertyId: mockPropertyId } };

            await favoriteController.toggleFavorite(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "User context not found"
            }));
        });

        test("should return 400 if propertyId is missing or invalid", async () => {
            req = {
                user: { _id: mockUserId } as any,
                body: { propertyId: "" } // Invalid/Empty
            };

            await favoriteController.toggleFavorite(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "Invalid Property ID or User ID"
            }));
        });
    });

    describe("getMyFavorites", () => {
        test("should return 200 and wishlist data", async () => {
            req = {
                user: { _id: mockUserId } as any,
                query: { page: "1", size: "12" }
            };

            const mockResult = {
                favorites: [{ _id: "fav1", property: { title: "Test Property" } }],
                pagination: { page: 1, size: 12, totalItems: 1, totalPages: 1 }
            };

            jest.spyOn(FavoriteService.prototype, 'getMyFavorites').mockResolvedValue(mockResult as any);

            await favoriteController.getMyFavorites(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Wishlist fetched successfully",
                data: mockResult.favorites
            }));
        });
    });

    describe("checkStatus", () => {
        test("should return isFavorited: true if service returns true", async () => {
            req = {
                user: { _id: mockUserId } as any,
                params: { propertyId: mockPropertyId }
            };

            jest.spyOn(FavoriteService.prototype, 'checkFavoriteStatus').mockResolvedValue({ isFavorited: true });

            await favoriteController.checkStatus(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                isFavorited: true
            });
        });
    });
});