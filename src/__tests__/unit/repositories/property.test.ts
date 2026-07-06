import { PropertyRepository } from "../../../repositories/property.repository";
import { PropertyModel } from "../../../models/property.model";
import { BookingModel } from "../../../models/booking.model";
import { BookingStatusEnum } from "../../../types/booking.types";
import { PropertyTypeEnum } from "../../../types/property.type";
import mongoose from "mongoose";

describe('Property Repository Tests', () => {
    let propertyRepository: PropertyRepository;

    beforeAll(() => {
        propertyRepository = new PropertyRepository();
    });

    afterEach(async () => {
        await PropertyModel.deleteMany({});
        await BookingModel.deleteMany({});
    });

    describe('createProperty', () => {
        test('should save a property to the database correctly', async () => {
            const propertyData = {
                title: 'Modern Luxury Apartment',
                description: 'This is a very long description to satisfy the twenty character requirement.',
                propertyType: PropertyTypeEnum.APARTMENT, 
                bhk: '2BHK',
                price: 1500,
                address: '123 Main St',
                city: 'Kathmandu',
                propertyImages: ['image1.jpg']
            };

            const savedProperty = await propertyRepository.createProperty(propertyData as any);
            
            expect(savedProperty._id).toBeDefined();
            expect(savedProperty.title).toBe('Modern Luxury Apartment');
            expect(savedProperty.propertyType).toBe("APARTMENT");
        });
    });

    describe('getPropertyById', () => {
        test('should return isRented: true if a CONFIRMED booking exists', async () => {
            const property = await PropertyModel.create({
                title: 'Available House for Rent',
                description: 'Description must be at least twenty characters long.',
                propertyType: PropertyTypeEnum.HOUSE,
                bhk: '3BHK',
                price: 2000,
                address: 'Street 1',
                city: 'Pokhara',
                propertyImages: ['img.png']
            });

            await BookingModel.create({
                property: property._id,
                user: new mongoose.Types.ObjectId(), 
                status: BookingStatusEnum.CONFIRMED
            });

            const result = await propertyRepository.getPropertyById(property._id.toString());

            expect(result.title).toBe('Available House for Rent');
            expect(result.isRented).toBe(true);
        });

        test('should return isRented: false if no confirmed booking exists', async () => {
            const property = await PropertyModel.create({
                title: 'Beautiful Unrented House',
                description: 'This is another long description for validation purposes.',
                propertyType: PropertyTypeEnum.HOUSE,
                bhk: '3BHK',
                price: 2000,
                address: 'Street 1',
                city: 'Pokhara',
                propertyImages: ['img.png']
            });

            // This is a PENDING booking, so isRented should be false
            await BookingModel.create({
                property: property._id,
                user: new mongoose.Types.ObjectId(),
                status: BookingStatusEnum.PENDING
            });

            const result = await propertyRepository.getPropertyById(property._id.toString());
            expect(result.isRented).toBe(false);
        });
    });

    describe('getAllProperty (Pagination and Search)', () => {
        beforeEach(async () => {
            const baseData = {
                description: 'A long enough description for the property listing.',
                propertyType: PropertyTypeEnum.APARTMENT,
                bhk: '2BHK',
                price: 100,
                address: 'Test Address',
                propertyImages: ['img']
            };

            await PropertyModel.insertMany([
                { ...baseData, title: 'Kathmandu Flat', city: 'Kathmandu' },
                { ...baseData, title: 'Pokhara Villa', city: 'Pokhara', propertyType: PropertyTypeEnum.HOUSE, bhk: '3BHK' },
                { ...baseData, title: 'Kathmandu House', city: 'Kathmandu', propertyType: PropertyTypeEnum.HOUSE, bhk: '3BHK' }
            ]);
        });

        test('should filter by search string in city', async () => {
            const { total } = await propertyRepository.getAllProperty(1, 10, 'Kathmandu');
            expect(total).toBe(2);
        });

        test('should filter by bhk and propertyType', async () => {
            const { total, property } = await propertyRepository.getAllProperty(1, 10, undefined, PropertyTypeEnum.HOUSE, '3BHK');
            expect(total).toBe(2);
            expect(property[0].propertyType).toBe("HOUSE");
        });
    });
});