import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { PropertyModel } from '../../models/property.model';
import jwt from 'jsonwebtoken';

describe('Security and Access Control Integration', () => {
    let userToken: string;
    let otherUserToken: string;
    let propertyId: string;

    beforeAll(async () => {
        await UserModel.deleteMany({});
        await PropertyModel.deleteMany({});

        // 1. Create a regular User
        const user = await UserModel.create({
            firstName: 'Other',    // ADD THIS
            lastName: 'Tester',
            username: 'regular_user',
            email: 'user@test.com',
            phoneNumber: '9800000010',
            password: 'Password123!',
            role: 'user'
        });
        userToken = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET || 'secret');

        // 2. Create another User (to test "not your data" scenarios)
        const otherUser = await UserModel.create({
            firstName: 'Other',    // ADD THIS
            lastName: 'Tester',
            username: 'other_user',
            email: 'other@test.com',
            phoneNumber: '9800000011',
            password: 'Password123!',
            role: 'user'
        });
        otherUserToken = jwt.sign({ id: otherUser._id, role: 'user' }, process.env.JWT_SECRET || 'secret');

        // 3. Create a Property
        const property = await PropertyModel.create({
            title: 'Protected Property',
            description: 'Property to test unauthorized modifications.',
            propertyType: 'HOUSE',
            bhk: '2BHK',
            price: 25000,
            address: 'Kathmandu',
            city: 'Kathmandu'
        });
        propertyId = property._id.toString();
    });

    describe('RBAC Enforcement (User vs Admin)', () => {
        test('should reject a regular user trying to access admin property creation', async () => {
            const response = await request(app)
                .post('/api/admin/properties') // Assuming your admin routes follow this pattern
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: "Hack Attempt" });

            expect(response.status).toBe(403); // Forbidden
            expect(response.body.success).toBe(false);
        });

        test('should reject a regular user trying to confirm a booking', async () => {
            // Using a fake booking ID to test permission first
            const response = await request(app)
                .patch('/api/admin/bookings/65f1a5f1a5f1a5f1a5f1a5f1/status')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'CONFIRMED' });

            expect(response.status).toBe(403);
        });
    });

    describe('Public vs Protected Data', () => {
        test('should allow unauthenticated users to see properties list', async () => {
            const response = await request(app).get('/api/properties');
            expect(response.status).toBe(200);
        });

        test('should reject requests with invalid/expired tokens', async () => {
            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer invalid-token-here`)
                .send({});

            expect(response.status).toBe(401); // Unauthorized
        });
    });
});