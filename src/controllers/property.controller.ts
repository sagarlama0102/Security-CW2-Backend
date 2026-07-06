import { PropertyService } from "../services/property.service";
import { NextFunction, Request, Response } from "express";
import z from "zod";
import { QueryParams } from "../types/query.type";

let propertyService = new PropertyService();
export class PropertyController{
    async getAllProperty(req: Request, res: Response){
        try{
            const {page, size, search, propertyType, bhk}: QueryParams = req.query;
            const {property, pagination} = await propertyService.getAllProperties(
                page, size, search, propertyType, bhk
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

    async getPropertyDetails(req: Request, res: Response) {
        try {
            const propertyId = req.params.id;
            const property = await propertyService.getPropertyDetails(propertyId);

            return res.status(200).json({
                success: true,
                message: "Property details fetched",
                data: property
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}