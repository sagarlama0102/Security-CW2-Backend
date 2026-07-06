import { PropertyRepository } from "../../repositories/property.repository";
import { HttpError } from "../../errors/http-error";
import { CreatePropertyDTO, UpdatePropertyDTO } from "../../dtos/property.dto";

let propertyRepository = new PropertyRepository();

export class AdminPropertyService {
    async createProperty(data: CreatePropertyDTO){
        const newProperty = await propertyRepository.createProperty(data);
        return newProperty;
    }
    async getPropertyById(id: string){
        const property = await propertyRepository.getPropertyById(id);
        if(!property) throw new HttpError(404, "property not found");
        return property;
    }
    async getAllProperty(
        page?: string, size?: string, search?: string
    ){
        const pageNumber = page ? parseInt(page): 1;
        const pageSize = size? parseInt(size): 10;
        const {property, total} = await propertyRepository.getAllProperty(
            pageNumber, pageSize, search
        );
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize)
        }
        return {property, pagination};
    }
    async updateProperty(id: string, updateData: UpdatePropertyDTO){
        const property = await propertyRepository.getPropertyById(id);
        if(!property){
            throw new HttpError(404, "Property not Found");
        }
        const updatedProperty = await propertyRepository.updateProperty(id, updateData);
        return updatedProperty;
    }
    async deleteProperty(id: string){
        const property = await propertyRepository.getPropertyById(id);
        if(!property){
            throw new HttpError(404, "Property not Found");
        }
        const deleted = await propertyRepository.deleteProperty(id);
        return deleted;
    }
    async updateOneProperty(id: string, data: any){
        const property = await propertyRepository.updateOneProperty(id, data);
        return property;
    }
    async deleteOneProperty(id:string){
        const property = await propertyRepository.deleteOneProperty(id);
        return property;
    }
}