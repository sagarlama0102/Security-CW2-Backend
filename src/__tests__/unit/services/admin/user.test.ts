import { AdminUserService } from "../../../../services/admin/user.service";
import { UserRepository } from "../../../../repositories/user.repository";
import { HttpError } from "../../../../errors/http-error";
import bcryptjs from "bcryptjs";

// Mock the dependencies
jest.mock("../../../../repositories/user.repository");
jest.mock("bcryptjs");

describe("AdminUserService Unit Tests", () => {
    let adminUserService: AdminUserService;
    const mockUserId = "user_123";

    beforeEach(() => {
        jest.clearAllMocks();
        adminUserService = new AdminUserService();
    });

    describe("createUser", () => {
        const userData = {
            firstName: "Admin",
            lastName: "Created",
            email: "newuser@example.com",
            username: "newadminuser",
            password: "password123",
            role: "user"
        };

        test("should throw 403 if email is already in use", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue({ _id: "exists" } as any);

            await expect(adminUserService.createUser(userData as any))
                .rejects
                .toThrow(new HttpError(403, "Email already in use"));
        });

        test("should throw 403 if username is already in use", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(null);
            jest.spyOn(UserRepository.prototype, 'getUserByUsername').mockResolvedValue({ _id: "exists" } as any);

            await expect(adminUserService.createUser(userData as any))
                .rejects
                .toThrow(new HttpError(403, "Username already in use"));
        });

        test("should hash password and create user successfully", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(null);
            jest.spyOn(UserRepository.prototype, 'getUserByUsername').mockResolvedValue(null);
            (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed_password");
            jest.spyOn(UserRepository.prototype, 'createUser').mockResolvedValue({ ...userData, password: "hashed_password" } as any);

            const result = await adminUserService.createUser(userData as any);

            expect(bcryptjs.hash).toHaveBeenCalledWith("password123", 10);
            expect(result.password).toBe("hashed_password");
            expect(UserRepository.prototype.createUser).toHaveBeenCalled();
        });
    });

    describe("getUserById", () => {
        test("should return user if found", async () => {
            const mockUser = { _id: mockUserId, email: "test@test.com" };
            jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue(mockUser as any);

            const result = await adminUserService.getUserById(mockUserId);
            expect(result).toEqual(mockUser);
        });

        test("should throw 404 if user not found", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue(null);

            await expect(adminUserService.getUserById(mockUserId))
                .rejects
                .toThrow(new HttpError(404, "User not found"));
        });
    });

    describe("getAllUsers", () => {
        test("should return paginated user data", async () => {
            const mockUsers = [{ _id: "1" }, { _id: "2" }];
            jest.spyOn(UserRepository.prototype, 'getAllUsers').mockResolvedValue({
                user: mockUsers as any,
                total: 20
            });

            const result = await adminUserService.getAllUsers("1", "10", "search_term");

            expect(result.user).toHaveLength(2);
            expect(result.pagination.totalPages).toBe(2);
            expect(result.pagination.totalItems).toBe(20);
        });
    });

    describe("updateUser", () => {
        test("should throw 404 if user to update does not exist", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue(null);

            await expect(adminUserService.updateUser(mockUserId, {} as any))
                .rejects
                .toThrow(new HttpError(404, "User not found"));
        });

        test("should update user if exists", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue({ _id: mockUserId } as any);
            jest.spyOn(UserRepository.prototype, 'updateUser').mockResolvedValue({ _id: mockUserId, firstName: "Updated" } as any);

            const result = await adminUserService.updateUser(mockUserId, { firstName: "Updated" } as any);
            expect(result?.firstName).toBe("Updated");
        });
    });

    describe("deleteUser", () => {
        test("should throw 404 if user to delete does not exist", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue(null);

            await expect(adminUserService.deleteUser(mockUserId))
                .rejects
                .toThrow(new HttpError(404, "User not found"));
        });

        test("should call delete in repository if user exists", async () => {
            jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue({ _id: mockUserId } as any);
            jest.spyOn(UserRepository.prototype, 'deleteUser').mockResolvedValue({ _id: mockUserId } as any);

            const result = await adminUserService.deleteUser(mockUserId);
            expect(UserRepository.prototype.deleteUser).toHaveBeenCalledWith(mockUserId);
        });
    });
});