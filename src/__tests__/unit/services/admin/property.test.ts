import { AdminPropertyService } from "../../../../services/admin/property.service";
import { PropertyRepository } from "../../../../repositories/property.repository";
import { HttpError } from "../../../../errors/http-error";
import { PropertyTypeEnum } from "../../../../types/property.type";

// 1. Mock the Repository
jest.mock("../../../../repositories/property.repository");

describe("AdminPropertyService Unit Tests", () => {
    let adminPropertyService: AdminPropertyService;
    const mockPropertyId = "prop_123";

    beforeEach(() => {
        jest.clearAllMocks();
        adminPropertyService = new AdminPropertyService();
    });

    describe("createProperty", () => {
        const propertyData = {
            title: "Admin Luxury Villa",
            description: "A beautiful property created by admin with sufficient characters.",
            propertyType: PropertyTypeEnum.HOUSE,
            bhk: "4BHK",
            price: 5000,
            address: "Admin Lane 1",
            city: "Kathmandu",
            propertyImages: ["image1.jpg"]
        };

        test("should successfully create a property via repository", async () => {
            jest.spyOn(PropertyRepository.prototype, 'createProperty').mockResolvedValue(propertyData as any);

            const result = await adminPropertyService.createProperty(propertyData as any);

            expect(result.title).toBe("Admin Luxury Villa");
            expect(PropertyRepository.prototype.createProperty).toHaveBeenCalledWith(propertyData);
        });
    });

    describe("getPropertyById", () => {
        test("should return property if it exists", async () => {
            const mockProp = { _id: mockPropertyId, title: "Found Prop" };
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(mockProp as any);

            const result = await adminPropertyService.getPropertyById(mockPropertyId);
            expect(result).toEqual(mockProp);
        });

        test("should throw 404 if property is not found", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(null);

            await expect(adminPropertyService.getPropertyById(mockPropertyId))
                .rejects
                .toThrow(new HttpError(404, "property not found"));
        });
    });

    describe("getAllProperty", () => {
        test("should return paginated property data for admin dashboard", async () => {
            const mockList = [{ _id: "p1" }, { _id: "p2" }];
            jest.spyOn(PropertyRepository.prototype, 'getAllProperty').mockResolvedValue({
                property: mockList as any,
                total: 50
            });

            const result = await adminPropertyService.getAllProperty("1", "10", "search_term");

            expect(result.property).toHaveLength(2);
            expect(result.pagination.totalPages).toBe(5);
            expect(result.pagination.totalItems).toBe(50);
            expect(PropertyRepository.prototype.getAllProperty).toHaveBeenCalledWith(1, 10, "search_term");
        });
    });

    describe("updateProperty", () => {
        test("should throw 404 if property to update does not exist", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(null);

            await expect(adminPropertyService.updateProperty(mockPropertyId, {} as any))
                .rejects
                .toThrow(new HttpError(404, "Property not Found"));
        });

        test("should update property successfully if it exists", async () => {
            const updateData = { price: 6000 };
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue({ _id: mockPropertyId } as any);
            jest.spyOn(PropertyRepository.prototype, 'updateProperty').mockResolvedValue({ _id: mockPropertyId, ...updateData } as any);

            const result = await adminPropertyService.updateProperty(mockPropertyId, updateData as any);
            
            expect(result!.price).toBe(6000);
            expect(PropertyRepository.prototype.updateProperty).toHaveBeenCalledWith(mockPropertyId, updateData);
        });
    });

    describe("deleteProperty", () => {
        test("should throw 404 if property to delete does not exist", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue(null);

            await expect(adminPropertyService.deleteProperty(mockPropertyId))
                .rejects
                .toThrow(new HttpError(404, "Property not Found"));
        });

        test("should call delete in repository if property exists", async () => {
            jest.spyOn(PropertyRepository.prototype, 'getPropertyById').mockResolvedValue({ _id: mockPropertyId } as any);
            jest.spyOn(PropertyRepository.prototype, 'deleteProperty').mockResolvedValue(true as any);

            const result = await adminPropertyService.deleteProperty(mockPropertyId);
            
            expect(result).toBe(true);
            expect(PropertyRepository.prototype.deleteProperty).toHaveBeenCalledWith(mockPropertyId);
        });
    });
});