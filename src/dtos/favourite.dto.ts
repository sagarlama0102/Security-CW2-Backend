import z from "zod";
import { FavoriteSchema } from "../types/favourite.types";

export const CreateFavouriteDTO = FavoriteSchema.pick({
    property: true,
}).extend({
    // Changed [] to {} for the .extend() method
    user: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID"),
});

export type CreateFavouriteDTO = z.infer<typeof CreateFavouriteDTO>;

export const CancelFavouriteDTO = z.object({
    // Consistent naming for the ID
    favouriteId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Favourite ID")
});

export type CancelFavouriteDTO = z.infer<typeof CancelFavouriteDTO>;