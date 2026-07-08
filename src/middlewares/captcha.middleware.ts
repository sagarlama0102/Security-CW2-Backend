import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const verifyCaptcha = async (
    req: Request, res: Response, next: NextFunction
) => {
    try {
        const captchaToken = req.body.captchaToken;

        if (!captchaToken) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA token is required'
            });
        }

        // verify with Google
        const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
            params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: captchaToken,
            }
        });

        const { success, score } = response.data;

        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA verification failed. Please try again'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'CAPTCHA verification error'
        });
    }
};