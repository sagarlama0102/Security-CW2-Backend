import z from "zod";

export const PropertySchema = z.object({
    title:z.string().min(5,"Title must be at least 5 characters"),
    description:z.string().min(20, "Description must be at least 20 characters"),
    // Categorization
    propertyType: z.enum(["HOUSE", "APARTMENT"], {
    message: "Please select House or Apartment",
  }),
  bhk: z.enum(["2BHK", "3BHK", "4BHK+"]),
  price: z.coerce.number().positive("Price must be a positive number"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  propertyImages: z.array(z.string()).optional(),

});

export type PropertyType = z.infer<typeof PropertySchema>;

export enum PropertyTypeEnum {
  HOUSE = "HOUSE",
  APARTMENT = "APARTMENT"
}