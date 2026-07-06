import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { PropertyModel } from '../../models/property.model';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

describe('Admin Property Integration Tests', () => {
    let adminToken: string;
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');

    beforeAll(async () => {
        // 1. Setup Admin
        await UserModel.deleteMany({});
        await PropertyModel.deleteMany({});

        const admin = await UserModel.create({
            username: 'propadmin',
            email: 'admin@property.com',
            phoneNumber: '9841222222',
            password: 'Password123!',
            role: 'admin',
            firstName: 'Prop',
            lastName: 'Admin'
        });

        adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'secret');

        // 2. Ensure a dummy image exists for testing upload
        const fixtureDir = path.join(__dirname, '../fixtures');
        if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir);
        if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, 'fake-image-content');
    });

    describe('POST /api/admin/properties', () => {
        test('should create a property with an image upload', async () => {
    const response = await request(app)
        .post('/api/admin/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Modern Kathmandu Apartment')
        .field('description', 'This is a very long description that exceeds the twenty character minimum requirement.')
        .field('propertyType', 'HOUSE') // Must be UPPERCASE to match z.enum
        .field('bhk', '3BHK')           // Must match the exact enum strings
        .field('price', '50000')        // z.coerce handles the string-to-number conversion
        .field('address', 'Lazimpat')
        .field('city', 'Kathmandu')
        .attach('propertyImages', testImagePath);

    // If it still fails, this log will tell you exactly which field is the culprit
    if (response.status !== 201) {
        console.log("Validation Errors:", JSON.stringify(response.body.message, null, 2));
    }

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
});

        test('should fail if price is missing (Zod Validation)', async () => {
            const response = await request(app)
                .post('/api/admin/properties')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('title', 'Invalid Property');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});