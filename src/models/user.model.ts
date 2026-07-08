import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";
const UserSchema: Schema = new Schema<UserType>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        phoneNumber: { type: String, unique: true },
        firstName: { type: String, required: true, },
        lastName: { type: String, required: true, },
        profilePicture: {type: String,required: false},
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        //______ ACCOUNT LOCKOUT FIELDS ____
        failedLoginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
        isLocked: { type: Boolean, default: false },

        // ____ PASSWORD POLICY FIELDS ____
        passwordHistory: { type: [String], default: [] },
        passwordChangedAt: { type: Date, default: Date.now },
        passwordExpiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        // _____ JWT FIELDS _____
        refreshToken: { type: String, default: null },
        // _____ MFA FIELDS _____
        mfaEnabled: { type: Boolean, default: false },
        mfaSecret: { type: String, default: null },
        mfaVerified: { type: Boolean, default: false },
    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }
);
// _____METHOD TO CHECK IF ACCOUNT IS LOCKED ____
UserSchema.methods.isAccountLocked = function () {
    if (this.lockUntil && this.lockUntil > new Date()) {
        return true; // still locked
    }
    return false;
};

export interface IUser extends UserType, Document { // combine UserType and Document
    _id: mongoose.Types.ObjectId; // mongo related attribute/ custom attributes
    createdAt: Date;
    updatedAt: Date;
    failedLoginAttempts: number;
    lockUntil: Date | null;
    isLocked: boolean;
    isAccountLocked(): boolean;
    passwordHistory: string[];
    passwordChangedAt: Date;
    passwordExpiresAt: Date;
    refreshToken: string | null;
    mfaEnabled: boolean;
    mfaSecret: string | null;
    mfaVerified: boolean;
}

export const UserModel = mongoose.model<IUser>('User', UserSchema);
// UserModel is the mongoose model for User collection
// db.users in MongoDB`