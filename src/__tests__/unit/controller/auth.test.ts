import { AuthController } from "../../../controllers/auth.controller";
import { UserService } from "../../../services/user.service";
import { Request, Response } from "express";

// 1. Mock the Service module
jest.mock("../../../services/user.service");

describe("AuthController Unit Tests", () => {
    let authController: AuthController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        authController = new AuthController();
        
        // Mocking Response object with chaining support
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("register", () => {
        const validUser = {
            username: "testuser",
            email: "test@gmail.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "Test",
            lastName: "User"
        };

        test("should return 201 if registration is successful", async () => {
            req = { body: validUser };
            
            // Spy on the prototype because the instance is created at the top of the controller file
            jest.spyOn(UserService.prototype, 'createUser').mockResolvedValue({ _id: "1", ...validUser } as any);

            await authController.register(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: "User Created" })
            );
        });

        test("should return 400 if Zod validation fails", async () => {
            req = { body: { email: "invalid-email" } }; 

            await authController.register(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false })
            );
        });
    });

    describe("getProfile", () => {
        test("should return 200 and user data if user is found", async () => {
            req = { user: { _id: "user123" } };
            jest.spyOn(UserService.prototype, 'getUserById').mockResolvedValue({ _id: "user123", username: "test" } as any);

            await authController.getProfile(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });

        test("should return 400 if user id is missing in request", async () => {
            req = { user: undefined };

            await authController.getProfile(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "user id not found" })
            );
        });
    });

    describe("updateProfile", () => {
        test("should return 200 and updated user", async () => {
            req = { 
                user: { _id: "user123" },
                body: { username: "newname", email: "new@test.com" } 
            };
            
            jest.spyOn(UserService.prototype, 'updateUser').mockResolvedValue({ _id: "user123", username: "newname" } as any);

            await authController.updateProfile(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "User profile updated successfully" })
            );
        });
    });
});