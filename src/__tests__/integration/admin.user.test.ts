import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import jwt from 'jsonwebtoken';

describe('Admin User Integration Tests', () => {
    let adminToken: string;

    beforeAll(async () => {
        // Clear all users to ensure a clean slate
        await UserModel.deleteMany({});

        const admin = await UserModel.create({
            username: 'superadmin',
            email: 'admin@test.com',
            phoneNumber: '9841000000', // Provide unique phone
            password: 'Password123!',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
        });

        adminToken = jwt.sign(
            { id: admin._id, role: admin.role }, 
            process.env.JWT_SECRET || 'secret'
        );
    });

    describe('DELETE /api/admin/users/:id', () => {
        test('should allow admin to delete a user', async () => {
            // Use unique data for the temporary user
            const timestamp = Date.now();
            const userToDelete = await UserModel.create({
                username: `user_${timestamp}`,
                email: `test_${timestamp}@example.com`,
                phoneNumber: `980${timestamp.toString().slice(-7)}`, // Unique phone
                password: 'Password123!',
                role: 'user',
                firstName: 'Test',
                lastName: 'Subject'
            });

            const response = await request(app)
                .delete(`/api/admin/users/${userToDelete._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const check = await UserModel.findById(userToDelete._id);
            expect(check).toBeNull();
        });
    });
});