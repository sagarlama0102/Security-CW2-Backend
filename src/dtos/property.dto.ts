import z from "zod";
import { PropertySchema } from "../types/property.type";

export const CreatePropertyDTO = PropertySchema.pick(
    {
        title: true,
        description: true,
        propertyType: true,
        bhk: true,
        price: true,
        address: true,
        city: true,
        propertyImages: true,

    }
)
export type CreatePropertyDTO = z.infer<typeof CreatePropertyDTO>;

export const UpdatePropertyDTO = PropertySchema.partial();

export type UpdatePropertyDTO = z.infer<typeof UpdatePropertyDTO>;
