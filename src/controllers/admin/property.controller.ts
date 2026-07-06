import { AdminPropertyService } from "../../services/admin/property.service";
import { NextFunction, Request, Response } from "express";
import z from "zod";
import { CreatePropertyDTO, UpdatePropertyDTO } from "../../dtos/property.dto";
import { QueryParams } from "../../types/query.type";

let adminPropertyService = new AdminPropertyService();

export class AdminPropertyController{
    async createProperty(req: Request, res: Response, next: NextFunction){
        try{
            const parsedData = CreatePropertyDTO.safeParse(req.body);
            if(!parsedData.success){
                return res.status(400).json(
                    {success: false, message:z.prettifyError(parsedData.error)}

                )
            }
            if(req.file){
                parsedData.data.propertyImages= [`/uploads/${req.file.filename}`];
            }
            const propertyData: CreatePropertyDTO = parsedData.data;
            const newProperty = await adminPropertyService.createProperty(propertyData);
            return res.status(201).json(
                {success: true, message: "Property Created", data: newProperty}
            );
        }catch(error: Error | any){
            return res.status(error.statusCode??500).json(
                {success: false, message: error.message|| "Internal Server Error"}
            );
        }
    }
    async getPropertyById(req: Request, res: Response){
        try{
            const propertyId = req.params.id;
            const property = await adminPropertyService.getPropertyById(propertyId);
            return res.status(200).json(
                {success: true, data: property, message: "Property Fetched"}
            )
        }catch(error: Error | any){
            return res.status(error.statusCode || 500).json(
                {success:false, message: error.message || "Internal Server Error"}
            );
        }
    }
    async getAllProperty(req:Request, res:Response){
        try{
            const {page, size, search}: QueryParams = req.query;
            const {property, pagination} = await adminPropertyService.getAllProperty(
                page, size, search
            );
            return res.status(200).json(
                {success:true, data: property ,pagination: pagination, message:"Property Fetched"}
            )
        }
        catch(error:Error | any){
            return res.status(error.statusCode || 500).json(
                {success:false, message:error.message || "Internal Server Error"}
            )
        }
    }
    // async updateOneProperty(req:Request, res: Response){
    //     try{
    //         const propertyId = req.params.id;
    //         const data = req.params.id;
    //         const property = await adminPropertyService.updateOneProperty(propertyId, data);
    //         return res.status(200).json(
    //             {success:true, message:"Property Updated"}
    //         )
    //     }catch(error: Error | any){
    //         return res.status(error.statusCode || 500).json(
    //             {success:false, message: error.message || "Internal Server Error"}
    //         );
    //     }
    // }
    // async deleteOneProperty(req:Request, res:Response){
    //     try{
    //         const propertyId = req.params.id;
    //         const property = await adminPropertyService.deleteOneProperty(propertyId);
    //         return res.status(200).json(
    //             {success:true, message:"Property Deleted"}
    //         )
    //     }
    //     catch(error: Error | any){
    //         return res.status(error.statusCode || 500).json(
    //             {success:false, message: error.message || "Internal Server Error"}
    //         );
    //     }
    // }
    async updateProperty(req: Request, res: Response, next: NextFunction){
        try{
            const propertyId = req.params.id;
            const parsedData = UpdatePropertyDTO.safeParse(req.body);
            if(!parsedData.success){
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            if(req.file){
                parsedData.data.propertyImages= [`/uploads/${req.file.filename}`];
            }
            const updateData: UpdatePropertyDTO = parsedData.data;
            const updatedProperty = await adminPropertyService.updateProperty(propertyId, updateData);
            return res.status(200).json(
                {success: true, message: "Property Updated", data: updatedProperty}
            );
        }catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
    async deleteProperty(req:Request, res: Response, next: NextFunction){
        try{
            const propertyId = req.params.id;
            const deleted = await adminPropertyService.deleteProperty(propertyId);
            if(!deleted){
                return res.status(404).json(
                    { success: false, message: "Property not found" }
                );
            }
            return res.status(200).json(
                {success: true, message: "Property Deleted"}
            );
        }catch (error: Error | any){
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}