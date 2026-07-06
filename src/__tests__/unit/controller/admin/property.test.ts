import { AdminPropertyController } from "../../../../controllers/admin/property.controller";
import { AdminPropertyService } from "../../../../services/admin/property.service";
import { Request, Response } from "express";
import mongoose from "mongoose";

// Mock the service
jest.mock("../../../../services/admin/property.service");

describe("AdminPropertyController Unit Tests", () => {
    let adminPropertyController: AdminPropertyController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    const mockPropertyId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        adminPropertyController = new AdminPropertyController();
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("createProperty", () => {
        const validPropertyData = {
            title: "Luxury Admin Penthouse",
            description: "A description that must be at least twenty characters long for Zod.",
            propertyType: "HOUSE",
            bhk: "3BHK",
            price: 4500,
            address: "Main Street 10",
            city: "Kathmandu"
        };

        test("should return 201 and convert uploaded file to propertyImages array", async () => {
            req = {
                body: validPropertyData,
                file: { filename: "house.jpg" } as any
            };

            const mockCreated = { ...validPropertyData, _id: mockPropertyId, propertyImages: ["/uploads/house.jpg"] };
            jest.spyOn(AdminPropertyService.prototype, 'createProperty').mockResolvedValue(mockCreated as any);

            await adminPropertyController.createProperty(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Property Created",
                data: expect.objectContaining({
                    propertyImages: ["/uploads/house.jpg"]
                })
            }));
        });

        test("should return 400 if Zod validation fails", async () => {
            req = { body: { title: "Short" } }; // Missing required fields and too short

            await adminPropertyController.createProperty(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
    });

    describe("getAllProperty", () => {
        test("should return 200 and paginated property list", async () => {
            req = {
                query: { page: "1", size: "5", search: "Penthouse" }
            };

            const mockResponse = {
                property: [{ _id: mockPropertyId, title: "Luxury Admin Penthouse" }],
                pagination: { page: 1, size: 5, totalItems: 1, totalPages: 1 }
            };

            jest.spyOn(AdminPropertyService.prototype, 'getAllProperty').mockResolvedValue(mockResponse as any);

            await adminPropertyController.getAllProperty(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockResponse.property,
                pagination: mockResponse.pagination
            }));
        });
    });

    describe("updateProperty", () => {
        test("should update property and return 200", async () => {
            req = {
                params: { id: mockPropertyId },
                body: { price: 5000 },
                file: { filename: "updated.jpg" } as any
            };

            jest.spyOn(AdminPropertyService.prototype, 'updateProperty').mockResolvedValue({ _id: mockPropertyId } as any);

            await adminPropertyController.updateProperty(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Property Updated"
            }));
        });
    });

    describe("deleteProperty", () => {
        test("should return 200 on successful delete", async () => {
            req = { params: { id: mockPropertyId } };
            jest.spyOn(AdminPropertyService.prototype, 'deleteProperty').mockResolvedValue(true as any);

            await adminPropertyController.deleteProperty(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Property Deleted"
            });
        });

        test("should return 404 if property doesn't exist", async () => {
            req = { params: { id: "invalid-id" } };
            jest.spyOn(AdminPropertyService.prototype, 'deleteProperty').mockResolvedValue(false as any);

            await adminPropertyController.deleteProperty(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "Property not found"
            }));
        });
    });
});