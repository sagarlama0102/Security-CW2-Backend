import { PropertyService } from "../../../services/property.service";
import { PropertyRepository } from "../../../repositories/property.repository";
import { HttpError } from "../../../errors/http-error";

// 1. Mock the repository module
jest.mock("../../../repositories/property.repository");

describe("PropertyService Unit Tests", () => {
    let propertyService: PropertyService;

    beforeEach(() => {
        jest.clearAllMocks();
        propertyService = new PropertyService();
    });

    describe("getAllProperties", () => {
        test("should return paginated properties with correct metadata", async () => {
            const mockProperties = [{ title: "House 1" }, { title: "House 2" }];
            const mockTotal = 24; // 24 items total

            // Spy on the prototype because of the top-level let propertyRepository
            jest.spyOn(PropertyRepository.prototype, 'getAllProperty').mockResolvedValue({
                property: mockProperties as any,
                total: mockTotal
            });

            // Call with page 1, size 10
            const result = await propertyService.getAllProperties("1", "10");

            expect(result.property).toHaveLength(2);
            expect(result.pagination).toEqual({
                page: 1,
                size: 10,
                totalItems: 24,
                totalPages: 3 // Math.ceil(24 / 10)
            });
        });

        test("should use default values if page and size are not provided", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getAllProperty').mockResolvedValue({
                property: [],
                total: 0
            });

            await propertyService.getAllProperties();

            // Verify defaults: page 1, size 12
            expect(PropertyRepository.prototype.getAllProperty).toHaveBeenCalledWith(
                1, 12, undefined, undefined, undefined
            );
        });
    });

    describe("getPropertyDetails", () => {
        test("should return property if it exists", async () => {
            const mockProperty = { _id: "prop123", title: "Luxury Flat" };
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(mockProperty as any);

            const result = await propertyService.getPropertyDetails("prop123");

            expect(result).toEqual(mockProperty);
            expect(PropertyRepository.prototype.getPropertyById).toHaveBeenCalledWith("prop123");
        });

        test("should throw 404 HttpError if property is not found", async () => {
            // Simulate repository returning null
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(null);

            await expect(propertyService.getPropertyDetails("invalid-id"))
                .rejects
                .toThrow(new HttpError(404, "Property not found"));
        });
    });
});