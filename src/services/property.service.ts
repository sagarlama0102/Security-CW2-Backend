import { CreatePropertyDTO, UpdatePropertyDTO } from "../dtos/property.dto";
import { PropertyRepository } from "../repositories/property.repository";
import { HttpError } from "../errors/http-error";


let propertyRepository = new PropertyRepository();

export class PropertyService{


    async getAllProperties(page?: string, size?: string, search?: string, propertyType?:string, bhk?:string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 12; // 12 works great for 3-column grids

        const { property, total } = await propertyRepository.getAllProperty(
            pageNumber, pageSize, search, propertyType, bhk
        );

        return {
            property,
            pagination: {
                page: pageNumber,
                size: pageSize,
                totalItems: total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }
    async getPropertyDetails(propertyId: string) {
        const property = await propertyRepository.getPropertyById(propertyId);
        if (!property) {
            throw new HttpError(404, "Property not found");
        }
        return property;
    }
}