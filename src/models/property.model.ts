import mongoose, {Document, Schema} from "mongoose"
import { PropertyType, PropertyTypeEnum } from "../types/property.type"

const PropertySchema: Schema = new Schema<PropertyType> (
    {
        title: {type:String, required: true,},
        description: {type: String, required: true},
        propertyType: { 
        type: String, 
        enum: Object.values(PropertyTypeEnum), 
        required: true 
        },
        bhk: { 
        type: String, 
        enum: ["2BHK", "3BHK", "4BHK+"], 
        required: true 
        },
        price: { type: Number, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        propertyImages: [{type: String, required: true}],


    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }

);

export interface IProperty extends PropertyType, Document{
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    
}
export const PropertyModel = mongoose.model<IProperty> ('Property', PropertySchema);

