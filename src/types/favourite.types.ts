import z from "zod";

export const FavoriteSchema = z.object({
  _id: z.string().optional(),
  property: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Property ID"), // Reference to Property
  user: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID"),         // Reference to User
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// TypeScript type inferred from the Zod Schema
export type FavoriteType = z.infer<typeof FavoriteSchema>;