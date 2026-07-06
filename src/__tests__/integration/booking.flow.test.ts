import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { PropertyModel } from '../../models/property.model';
import { BookingModel } from '../../models/booking.model';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('End-to-End Booking Flow Integration', () => {
    let adminToken: string;
    let userToken: string;
    let userId: string; // We need this for the strict schema
    let propertyId: string;
    let bookingId: string;

    beforeAll(async () => {
        await UserModel.deleteMany({});
        await PropertyModel.deleteMany({});
        await BookingModel.deleteMany({});

        // 1. Create Admin
        const admin = await UserModel.create({
            username: 'admin_flow',
            email: 'admin@flow.com',
            phoneNumber: '9800000001',
            password: 'Password123!',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'Flow'
        });
        adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'secret');

        // 2. Create Regular User
        const user = await UserModel.create({
            username: 'tenant_user',
            email: 'tenant@test.com',
            phoneNumber: '9800000002',
            password: 'Password123!',
            role: 'user',
            firstName: 'Tenant',
            lastName: 'User'
        });
        userId = user._id.toString(); // Save this ID
        userToken = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET || 'secret');

        // 3. Create Property
        const property = await PropertyModel.create({
            title: 'Test Booking Property',
            description: 'This is a description that is long enough for Zod validation requirement.',
            propertyType: 'HOUSE',
            bhk: '2BHK',
            price: 25000,
            address: 'Jhamsikhel',
            city: 'Lalitpur'
        });
        propertyId = property._id.toString();
    });

    describe('Booking Lifecycle', () => {
        
        test('Step 1: User should be able to request a booking', async () => {
            const response = await request(app)
                .post('/api/bookings') 
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    _id: new mongoose.Types.ObjectId().toString(), // Required by your schema
                    user: userId,                                  // Required by your schema
                    property: propertyId,                          // Required by your schema (key matches 'at property')
                    message: "I am interested in this house! This is a long message."
                });

            if (response.status !== 201) {
                console.error("Validation/Logic Error:", JSON.stringify(response.body.message || response.body, null, 2));
            }

            expect(response.status).toBe(201);
            bookingId = response.body.data._id;
        });

        test('Step 2: Admin should be able to confirm the booking', async () => {
            if (!bookingId) throw new Error("BookingId undefined");

            const response = await request(app)
                .patch(`/api/admin/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'CONFIRMED' });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('CONFIRMED');
        });

    });
});