import { AdminUserController } from "../../../../controllers/admin/admin.controller";
import { AdminUserService } from "../../../../services/admin/user.service";
import { Request, Response } from "express";
import mongoose from "mongoose";

// 1. Mock the AdminUserService
jest.mock("../../../../services/admin/user.service");

describe("AdminUserController Unit Tests", () => {
    let adminUserController: AdminUserController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        adminUserController = new AdminUserController();

        // Mock Express Response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("createUser", () => {
        const validUserBody = {
            firstName: "John",
            lastName: "Admin",
            email: "john@example.com",
            username: "johnadmin",
            password: "SecurePassword123",
            role: "user"
        };


        test("should return 400 if Zod validation fails", async () => {
            req = { body: { email: "invalid-email" } }; // Missing required fields

            await adminUserController.createUser(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
    });

    describe("getAllUsers", () => {
        test("should return 200 and list of users with pagination", async () => {
            req = {
                query: { page: "1", size: "10", search: "John" }
            };

            const mockResult = {
                user: [{ _id: mockUserId, firstName: "John" }],
                pagination: { page: 1, size: 10, totalItems: 1, totalPages: 1 }
            };

            jest.spyOn(AdminUserService.prototype, 'getAllUsers').mockResolvedValue(mockResult as any);

            await adminUserController.getAllUsers(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockResult.user,
                pagination: mockResult.pagination
            }));
        });
    });

    describe("updateUser", () => {
        test("should return 200 after successful update", async () => {
            req = {
                params: { id: mockUserId },
                body: { firstName: "UpdatedName" }
            };

            jest.spyOn(AdminUserService.prototype, 'updateUser').mockResolvedValue({ _id: mockUserId, firstName: "UpdatedName" } as any);

            await adminUserController.updateUser(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "User Updated"
            }));
        });
    });

    describe("deleteUser", () => {
        test("should return 200 on successful deletion", async () => {
            req = { params: { id: mockUserId } };
            jest.spyOn(AdminUserService.prototype, 'deleteUser').mockResolvedValue({ _id: mockUserId } as any);

            await adminUserController.deleteUser(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "User Deleted"
            }));
        });

        test("should return 404 if service returns null for deletion", async () => {
            req = { params: { id: "non-existent" } };
            jest.spyOn(AdminUserService.prototype, 'deleteUser').mockResolvedValue(false as any);

            await adminUserController.deleteUser(req as Request, res as Response, jest.fn());

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "User not found"
            }));
        });
    });
});