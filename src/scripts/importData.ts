import { connect } from 'mongoose';
import { Property } from '../models/Property';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property_listing';

async function importData() {
    try {
        // Connect to MongoDB
        await connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Read the CSV file
        const csvFilePath = path.join(__dirname, '../../data/property_data.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        // Parse CSV
        const parser = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        // Process each record
        for await (const record of parser) {
            // Preprocessing: handle missing or malformed fields
            const features = record.features
                ? record.features.split(',').map((f: string) => f.trim())
                : [];
            const images = record.images
                ? record.images.split(',').map((i: string) => i.trim())
                : [];
            const price = parseFloat(record.price);
            const bedrooms = parseInt(record.bedrooms);
            const bathrooms = parseInt(record.bathrooms);
            const area = parseFloat(record.area);

            // Optional: skip records with missing required fields
            if (!record.title || isNaN(price) || !record.location) {
                console.warn('Skipping invalid record:', record);
                continue;
            }

            const property = new Property({
                title: record.title.trim(),
                description: record.description?.trim() || '',
                price,
                location: record.location.trim(),
                propertyType: record.propertyType?.trim() || 'Unknown',
                bedrooms: isNaN(bedrooms) ? 0 : bedrooms,
                bathrooms: isNaN(bathrooms) ? 0 : bathrooms,
                area: isNaN(area) ? 0 : area,
                features,
                images,
                status: record.status?.trim() || 'available',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await property.save();
            console.log(`Imported property: ${property.title}`);
        }

        console.log('Data import completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}

importData();
