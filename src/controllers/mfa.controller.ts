import { Request, Response } from 'express';
import { MFAService } from '../services/mfa.service';

const mfaService = new MFAService();

export class MFAController {

    async setupMFA(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { secret, qrCode } = await mfaService.setupMFA(userId.toString());
            return res.status(200).json({
                success: true,
                message: 'Scan the QR code with your authenticator app',
                data: { secret, qrCode }
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async verifyAndEnableMFA(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }
            const result = await mfaService.verifyAndEnableMFA(userId.toString(), token);
            return res.status(200).json({ success: true, ...result });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async verifyMFAToken(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }
            const result = await mfaService.verifyMFAToken(userId.toString(), token);
            return res.status(200).json({ success: true, ...result });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async disableMFA(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }
            const result = await mfaService.disableMFA(userId.toString(), token);
            return res.status(200).json({ success: true, ...result });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}