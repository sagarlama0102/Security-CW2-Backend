import { UserService } from "../../../services/user.service";
import { UserRepository } from "../../../repositories/user.repository";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { HttpError } from "../../../errors/http-error";
import { sendEmail } from "../../../config/email";

// Mock the dependencies
jest.mock("../../../repositories/user.repository");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../../config/email");

describe("UserService Unit Tests", () => {
    let userService: UserService;
    let mockUserRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        userService = new UserService();
        // Access the mocked instance
        mockUserRepository = (UserRepository as any).prototype;
    });

    describe("createUser", () => {
        const userData = {
            username: "testuser",
            email: "test@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "John",
            lastName: "Doe"
        };

        test("should throw 403 if email is already in use", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue({ id: "1" } as any);

            await expect(userService.createUser(userData))
                .rejects
                .toThrow(new HttpError(403, "Email already in use"));
        });

        test("should hash password and create user if data is valid", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null);
            mockUserRepository.getUserByUsername.mockResolvedValue(null);
            (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed_pass");
            mockUserRepository.createUser.mockResolvedValue({ ...userData, password: "hashed_pass" } as any);

            const result = await userService.createUser(userData);

            expect(bcryptjs.hash).toHaveBeenCalledWith("Password123!", 10);
            expect(mockUserRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({ password: "hashed_pass" })
            );
            expect(result.username).toBe("testuser");
        });
    });

    describe("loginUser", () => {
        const loginData = { email: "test@test.com", password: "password123" };
        const mockUser = { 
            _id: "user123", 
            email: "test@test.com", 
            password: "hashed_password",
            role: "user" 
        };

        test("should throw 401 if password does not match", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(mockUser as any);
            (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

            await expect(userService.loginUser(loginData))
                .rejects
                .toThrow(new HttpError(401, "Invalid credentials"));
        });

        test("should return token and user on successful login", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(mockUser as any);
            (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("mock_token");

            const result = await userService.loginUser(loginData);

            expect(result).toHaveProperty("token", "mock_token");
            expect(result.user.email).toBe(mockUser.email);
        });
    });

    describe("sendResetPasswordEmail", () => {
        test("should throw 404 if user is not found", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null);

            await expect(userService.sendResetPasswordEmail("wrong@test.com"))
                .rejects
                .toThrow(new HttpError(404, "User not found"));
        });

        test("should call sendEmail when valid email is provided", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue({ _id: "1", email: "test@test.com" } as any);
            (jwt.sign as jest.Mock).mockReturnValue("reset_token");
            (sendEmail as jest.Mock).mockResolvedValue(true);

            await userService.sendResetPasswordEmail("test@test.com");

            expect(sendEmail).toHaveBeenCalledWith(
                "test@test.com",
                "Password Reset",
                expect.stringContaining("reset_token")
            );
        });
    });
});