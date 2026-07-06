import { PropertyController } from "../../../controllers/property.controller";
import { PropertyService } from "../../../services/property.service";
import { Request, Response } from "express";

// 1. Mock the Service Layer
jest.mock("../../../services/property.service");

describe("PropertyController Unit Tests", () => {
    let propertyController: PropertyController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        propertyController = new PropertyController();

        // Standard Express Response Mock
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("getAllProperty", () => {
        test("should return 200 and property list on success", async () => {
            const mockData = {
                property: [{ title: "Luxury Apartment", price: 5000 }],
                pagination: { page: 1, size: 12, totalItems: 1, totalPages: 1 }
            };

            req = {
                query: { page: "1", size: "12", search: "Luxury" }
            };

            // Mock the service response
            jest.spyOn(PropertyService.prototype, 'getAllProperties').mockResolvedValue(mockData as any);

            await propertyController.getAllProperty(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Property Fetched",
                    data: mockData.property,
                    pagination: mockData.pagination
                })
            );
        });

        test("should return 500 (or service error status) on failure", async () => {
            req = { query: {} };
            
            jest.spyOn(PropertyService.prototype, 'getAllProperties').mockRejectedValue({
                statusCode: 400,
                message: "Invalid query params"
            });

            await propertyController.getAllProperty(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: "Invalid query params" })
            );
        });
    });

    describe("getPropertyDetails", () => {
        test("should return 200 and property details for a valid ID", async () => {
            const mockProperty = { _id: "prop123", title: "Standard Room" };
            req = { params: { id: "prop123" } };

            jest.spyOn(PropertyService.prototype, 'getPropertyDetails').mockResolvedValue(mockProperty as any);

            await propertyController.getPropertyDetails(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockProperty
                })
            );
        });

        test("should return 404 if property service throws 404", async () => {
            req = { params: { id: "nonexistent" } };

            jest.spyOn(PropertyService.prototype, 'getPropertyDetails').mockRejectedValue({
                statusCode: 404,
                message: "Property not found"
            });

            await propertyController.getPropertyDetails(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: "Property not found" })
            );
        });
    });
});