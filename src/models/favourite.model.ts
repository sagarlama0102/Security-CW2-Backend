import mongoose, { Document, Schema } from "mongoose";
import { FavoriteType } from "../types/favourite.types";

// Note: Using Schema.Types.ObjectId for relational linking between User and Property
const FavoriteSchema: Schema = new Schema(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property", // Name of your Property model
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Name of your User model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

FavoriteSchema.index({ user: 1, property: 1 }, { unique: true });

// This interface helps TypeScript understand the MongoDB document
export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Export the model - checking if it exists first to prevent re-compilation errors in Next.js
export const FavoriteModel = 
  mongoose.models.Favorites || mongoose.model<IFavorite>("Favorites", FavoriteSchema);