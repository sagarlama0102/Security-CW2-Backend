import z from "zod";

export const UserSchema = z.object({
    username: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    role: z.enum(["user", "admin"]).default("user"),
    profilePicture: z.string().nullable().optional(),
    // ____ ACCOUNT LOCKOUT FIELDS ____
    failedLoginAttempts: z.number().default(0).optional(),
    lockUntil: z.date().nullable().optional(),
    isLocked: z.boolean().default(false).optional(),
    // _____ PASSWORD POLICY FIELDS ______
    passwordHistory: z.array(z.string()).default([]).optional(),
    passwordChangedAt: z.date().optional(),
    passwordExpiresAt: z.date().optional(),
    
    refreshToken: z.string().nullable().optional(),

    // _____ MFA FIELDS _____
    mfaEnabled: z.boolean().default(false).optional(),
    mfaSecret: z.string().nullable().optional(),
    mfaVerified: z.boolean().default(false).optional(),
    
});

export type UserType = z.infer<typeof UserSchema>;