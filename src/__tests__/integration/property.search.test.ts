import request from 'supertest';
import app from '../../app';
import { PropertyModel } from '../../models/property.model';
import { BookingModel } from '../../models/booking.model';
import { BookingStatusEnum } from '../../types/booking.types';
import mongoose from 'mongoose';

describe('Property Discovery & Status Integration', () => {
    let testPropertyId: string;

    beforeAll(async () => {
        await PropertyModel.deleteMany({});
        await BookingModel.deleteMany({});

        const properties = await PropertyModel.insertMany([
            {
                title: 'Modern Kathmandu Apartment',
                description: 'A very beautiful and spacious apartment.',
                propertyType: 'APARTMENT',
                bhk: '2BHK',
                price: 25000,
                address: 'Lazimpat',
                city: 'Kathmandu'
            },
            {
                title: 'Pokhara Lakeside Villa',
                description: 'Luxury villa with mountain views.',
                propertyType: 'HOUSE',
                bhk: '4BHK+',
                price: 60000,
                address: 'Lakeside',
                city: 'Pokhara'
            }
        ]);
        testPropertyId = properties[0]._id.toString();
    });

    //  1. Search & Filter Tests
    test('should find property by city search (case-insensitive)', async () => {
        const response = await request(app)
            .get('/api/properties')
            .query({ search: 'kathmandu' }); // Lowercase to test regex 'i'

        expect(response.status).toBe(200);
        expect(response.body.data[0].city).toBe('Kathmandu');
    });

    test('should filter by propertyType and bhk combined', async () => {
        const response = await request(app)
            .get('/api/properties')
            .query({ propertyType: 'HOUSE', bhk: '4BHK+' });

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toContain('Pokhara');
    });

    // 2. The "isRented" Calculated Field Test
    test('should show isRented as false when no confirmed booking exists', async () => {
        const response = await request(app).get(`/api/properties/${testPropertyId}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.isRented).toBe(false);
    });

    test('should show isRented as true when a CONFIRMED booking exists', async () => {
        // Manually create a confirmed booking for the test property
        await BookingModel.create({
            _id: new mongoose.Types.ObjectId(),
            property: testPropertyId,
            user: new mongoose.Types.ObjectId(),
            status: BookingStatusEnum.CONFIRMED
        });

        const response = await request(app).get(`/api/properties/${testPropertyId}`);

        expect(response.status).toBe(200);
        expect(response.body.data.isRented).toBe(true);
    });
});