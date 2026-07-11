import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { UserRepository } from '../repositories/user.repository';
import { HttpError } from '../errors/http-error';
import { logActivity, ActivityActions } from '../config/activity_logger';

const userRepository = new UserRepository();

export class MFAService {

    // ===== GENERATE MFA SECRET AND QR CODE =====
    async setupMFA(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    // ===== GUARD: prevent overwriting an active MFA secret =====
    // without this, calling setup again would invalidate the user's
    // existing authenticator entry and lock them out of their account
    if (user.mfaEnabled) {
        throw new HttpError(400, 'MFA is already enabled. Disable it first to reconfigure');
    }

    const secret = speakeasy.generateSecret({
        name: `RentEase (${user.email})`,
        issuer: 'RentEase',
    });

    await userRepository.updateUser(userId, {
        mfaSecret: secret.base32,
        mfaVerified: false,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
    };
}

    // ===== VERIFY MFA TOKEN AND ENABLE MFA _____
    async verifyAndEnableMFA(userId: string, token: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        if (!user.mfaSecret) {
            throw new HttpError(400, 'MFA setup not initiated');
        }

        // verify the token
        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: token,
            window: 1, // allow 1 step tolerance for time drift
        });

        if (!isValid) {
            throw new HttpError(400, 'Invalid MFA token');
        }

        // enable MFA
        await userRepository.updateUser(userId, {
            mfaEnabled: true,
            mfaVerified: true,
        });

        logActivity({
            userId,
            action: 'MFA_ENABLED',
            status: 'success',
            details: { email: user.email }
        });

        return { message: 'MFA enabled successfully' };
    }

    // _____ VERIFY MFA TOKEN ON LOGIN _____
    async verifyMFAToken(userId: string, token: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        if (!user.mfaSecret) {
            throw new HttpError(400, 'MFA not set up');
        }

        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: token,
            window: 1,
        });

        if (!isValid) {
            logActivity({
                userId,
                action: 'MFA_VERIFICATION_FAILED',
                status: 'failure',
                details: { email: user.email }
            });
            throw new HttpError(401, 'Invalid MFA token');
        }

        logActivity({
            userId,
            action: 'MFA_VERIFICATION_SUCCESS',
            status: 'success',
            details: { email: user.email }
        });

        return { verified: true };
    }
    

    // _____ DISABLE MFA ____
    async disableMFA(userId: string, token: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        if (!user.mfaEnabled) {
            throw new HttpError(400, 'MFA is not enabled');
        }

        // verify token before disabling
        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret!,
            encoding: 'base32',
            token: token,
            window: 1,
        });

        if (!isValid) {
            throw new HttpError(401, 'Invalid MFA token');
        }

        await userRepository.updateUser(userId, {
            mfaEnabled: false,
            mfaSecret: null,
            mfaVerified: false,
        });

        logActivity({
            userId,
            action: 'MFA_DISABLED',
            status: 'success',
            details: { email: user.email }
        });

        return { message: 'MFA disabled successfully' };
    }
}