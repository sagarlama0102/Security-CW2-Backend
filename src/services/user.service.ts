import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import  bcryptjs from "bcryptjs"
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { sendEmail } from "../config/email";
import { validatePasswordStrength } from '../middlewares/password-policy.middleware';
import { logActivity,ActivityActions } from "../config/activity_logger";

let userRepository = new UserRepository();

const CLIENT_URL = process.env.CLIENT_URI as string;


export class UserService {
    async createUser(data: CreateUserDTO){
        // business logic before creating user
        const emailCheck = await userRepository.getUserByEmail(data.email);
        if(emailCheck){
            throw new HttpError(403, "Email already in use");
        }
        const usernameCheck = await userRepository.getUserByUsername(data.username);
        if(usernameCheck){
            throw new HttpError(403, "Username already in use");
        }
        // check password strength
        const { isValid, errors } = validatePasswordStrength(data.password);
        if (!isValid) {
            throw new HttpError(400, errors.join(', '));
        }
        // hash password
        const hashedPassword = await bcryptjs.hash(data.password, 12); // 12 - complexity
        data.password = hashedPassword;

        // create user
        const newUser = await userRepository.createUser(data);
        logActivity({
    userId: newUser._id.toString(),
    action: ActivityActions.REGISTER,
    status: 'success',
    details: { email: newUser.email, username: newUser.username }
});
        return newUser;
    }

    async loginUser(data: LoginUserDTO){
        const user =  await userRepository.getUserByEmail(data.email);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        // ____CHECK IF ACCOUNT IS LOCKED ____
        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            throw new HttpError(423, `Account is locked. Try again in ${minutesLeft} minute(s)`);
        }
        // compare password
        const validPassword = await bcryptjs.compare(data.password, user.password);
        // plaintext, hashed
        if(!validPassword){
            const attempts = (user.failedLoginAttempts || 0) + 1;
        const MAX_ATTEMPTS = 5;

        if (attempts >= MAX_ATTEMPTS) {
            // lock account for 30 minutes
            await userRepository.updateUser(user._id.toString(), {
                failedLoginAttempts: attempts,
                lockUntil: new Date(Date.now() + 30 * 60 * 1000),
                isLocked: true,
            });
            logActivity({
        userId: user._id.toString(),
        action: ActivityActions.ACCOUNT_LOCKED,
        status: 'failure',
        details: { email: data.email, reason: 'Too many failed login attempts' }
    });
            throw new HttpError(423, "Account locked due to too many failed attempts. Try again in 30 minutes");
        }

        await userRepository.updateUser(user._id.toString(), {
            failedLoginAttempts: attempts,
        });
        logActivity({
    userId: user._id.toString(),
    action: ActivityActions.LOGIN_FAILED,
    status: 'failure',
    details: { email: data.email, attemptsRemaining: MAX_ATTEMPTS - attempts }
});

        throw new HttpError(401, `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining`);
        }
        // ===== CHECK IF PASSWORD IS EXPIRED =====
        if (user.passwordExpiresAt && user.passwordExpiresAt < new Date()) {
            throw new HttpError(403, 'Your password has expired. Please reset your password to continue');
        }

         // ____RESET FAILED ATTEMPTS ON SUCCESS _____
        await userRepository.updateUser(user._id.toString(), {
            failedLoginAttempts: 0,
            lockUntil: null,
            isLocked: false,
        });
        // generate jwt
        const payload = { // user identifier
            id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // 30 days
        logActivity({
    userId: user._id.toString(),
    action: ActivityActions.LOGIN_SUCCESS,
    status: 'success',
    details: { email: user.email }
});
        return { token, user }
        
    }
    async getUserById(userId: string){
        const user = await userRepository.getUserById(userId);
        if(!user){
            throw new HttpError(404, "user not found");
        }
        return user;
    }async updateUser(userId: string, data: UpdateUserDTO){
        const user = await userRepository.getUserById(userId);
        if(!user){
            throw new HttpError(404, "User not found");
        }if(user.email !==data.email){
            const emailExists = await userRepository.getUserByEmail(data.email!);
            if(emailExists){
                throw new HttpError(403, "Email already exists");
            }
        }
        if(user.username !== data.username){
            const usernameExists = await userRepository.getUserByUsername(data.username!);
            if(usernameExists){
                throw new HttpError(403, "Username already in use");
            }
        }
        if(data.password){
            // validate password strength
            const { isValid, errors } = validatePasswordStrength(data.password);
            if (!isValid) {
                throw new HttpError(400, errors.join(', '));
            }
            const hashedPassword = await bcryptjs.hash(data.password, 12);
            // check password history - prevent reuse of last 5 passwords
            const recentPasswords = user.passwordHistory || [];
            for (const oldPassword of recentPasswords) {
                const isSame = await bcryptjs.compare(data.password, oldPassword);
                if (isSame) {
                    throw new HttpError(400, 'You cannot reuse any of your last 5 passwords');
                }
            }
                // add current password to history before updating
            const updatedHistory = [user.password, ...recentPasswords].slice(0, 5);

            data.password = hashedPassword;
            (data as any).passwordHistory = updatedHistory;
            (data as any).passwordChangedAt = new Date();
            (data as any).passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            
        }
        const updatedUser = await userRepository.updateOneUser(userId, data);
        return updatedUser;
    }

    async sendResetPasswordEmail(email?: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' }); // 1 hour expiry
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
        await sendEmail(user.email, "Password Reset", html);
        return user;
    }

    async resetPassword(token?: string, newPassword?: string) {
        try {
            if (!token || !newPassword) {
                throw new HttpError(400, "Token and new password are required");
            }
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;
            const user = await userRepository.getUserById(userId);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            const hashedPassword = await bcryptjs.hash(newPassword, 12);
            await userRepository.updateUser(userId, { password: hashedPassword });
            logActivity({
    userId: user._id.toString(),
    action: ActivityActions.PASSWORD_RESET_SUCCESS,
    status: 'success',
    details: { email: user.email }
});
            return user;
        } catch (error) {
            throw new HttpError(400, "Invalid or expired token");
        }
    }

    
}