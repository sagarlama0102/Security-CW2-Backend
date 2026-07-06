import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authorizationMiddleware, adminMiddleware } from "../../../middlewares/authorization.middleware";
import { UserRepository } from "../../../repositories/user.repository";
import { JWT_SECRET } from "../../../config";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../../repositories/user.repository");
jest.mock("../../../database/mongodb", () => ({
  connectDatabaseTest: jest.fn().mockResolvedValue(true)
}));

describe("Authorization Middleware Unit Tests", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockUserRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = (UserRepository as any).prototype;
        
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("authorizationMiddleware", () => {
        test("should pass and attach user to req if token and user are valid", async () => {
            const mockToken = "valid.token.here";
            const mockDecoded = { id: "user123" };
            const mockUser = { _id: "user123", username: "test", role: "user" };

            mockRequest.headers = { authorization: `Bearer ${mockToken}` };
            
            (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
            mockUserRepository.getUserById.mockResolvedValue(mockUser as any);

            await authorizationMiddleware(
                mockRequest as Request, 
                mockResponse as Response, 
                nextFunction
            );

            expect(mockRequest.user).toBe(mockUser);
            expect(nextFunction).toHaveBeenCalled();
        });

        test("should return 401 if authorization header is missing", async () => {
            mockRequest.headers = {};

            await authorizationMiddleware(
                mockRequest as Request, 
                mockResponse as Response, 
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Unauthorized, header malformed" })
            );
        });

        test("should return 401 if user is not found in database", async () => {
            mockRequest.headers = { authorization: "Bearer some-token" };
            (jwt.verify as jest.Mock).mockReturnValue({ id: "non-existent" });
            mockUserRepository.getUserById.mockResolvedValue(null);

            await authorizationMiddleware(
                mockRequest as Request, 
                mockResponse as Response, 
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Unauthorized, User not found" })
            );
        });
    });

    describe("adminMiddleware", () => {
        test("should call next() if user role is admin", async () => {
            mockRequest.user = { role: "admin" };

            await adminMiddleware(
                mockRequest as Request, 
                mockResponse as Response, 
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        test("should return 403 if user role is not admin", async () => {
            mockRequest.user = { role: "user" };

            await adminMiddleware(
                mockRequest as Request, 
                mockResponse as Response, 
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Forbidden not admin" })
            );
        });

        test("should return 401 if req.user is missing", async () => {
            mockRequest.user = undefined;

            await adminMiddleware(
                mockRequest as Request, 
                mockResponse as Response, 
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });
});