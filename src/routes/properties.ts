import express from 'express';
import { body, validationResult } from 'express-validator';
import { Property } from '../models/Property';
import { auth, checkPropertyOwnership } from '../middleware/auth';
import { cacheService } from '../services/cache';

const router = express.Router();

// Create property
router.post('/',
    auth,
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('price').isNumeric().withMessage('Price must be a number'),
        body('location').notEmpty().withMessage('Location is required'),
        body('propertyType').isIn(['Apartment', 'House', 'Villa', 'Condo', 'Townhouse']).withMessage('Invalid property type'),
        body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),
        body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a positive number'),
        body('area').isNumeric().withMessage('Area must be a number')
    ],
    async (req: any, res: express.Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const property = new Property({
                ...req.body,
                createdBy: req.user._id
            });

            await property.save();
            await cacheService.clearPattern('properties:*');

            res.status(201).json(property);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Get all properties with advanced filtering
router.get('/', async (req: express.Request, res: express.Response) => {
    try {
        const {
            search,
            minPrice,
            maxPrice,
            propertyType,
            minBedrooms,
            maxBedrooms,
            minBathrooms,
            maxBathrooms,
            minArea,
            maxArea,
            location,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query: any = {};

        if (search) {
            query.$text = { $search: search as string };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (propertyType) {
            query.propertyType = propertyType;
        }

        if (minBedrooms || maxBedrooms) {
            query.bedrooms = {};
            if (minBedrooms) query.bedrooms.$gte = Number(minBedrooms);
            if (maxBedrooms) query.bedrooms.$lte = Number(maxBedrooms);
        }

        if (minBathrooms || maxBathrooms) {
            query.bathrooms = {};
            if (minBathrooms) query.bathrooms.$gte = Number(minBathrooms);
            if (maxBathrooms) query.bathrooms.$lte = Number(maxBathrooms);
        }

        if (minArea || maxArea) {
            query.area = {};
            if (minArea) query.area.$gte = Number(minArea);
            if (maxArea) query.area.$lte = Number(maxArea);
        }

        if (location) {
            query.location = new RegExp(location as string, 'i');
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Try to get from cache first
        const cacheKey = `properties:${JSON.stringify(query)}:${JSON.stringify(sort)}:${page}:${limit}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Get properties from database
        const properties = await Property.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate('createdBy', 'name email');

        const total = await Property.countDocuments(query);

        const result = {
            properties,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        };

        // Cache the result
        await cacheService.set(cacheKey, JSON.stringify(result), 300); // Cache for 5 minutes

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single property
router.get('/:id', async (req: express.Request, res: express.Response) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        res.json(property);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update property
router.put('/:id',
    auth,
    checkPropertyOwnership,
    [
        body('title').optional().notEmpty().withMessage('Title cannot be empty'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('price').optional().isNumeric().withMessage('Price must be a number'),
        body('location').optional().notEmpty().withMessage('Location cannot be empty'),
        body('propertyType').optional().isIn(['Apartment', 'House', 'Villa', 'Condo', 'Townhouse']).withMessage('Invalid property type'),
        body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),
        body('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a positive number'),
        body('area').optional().isNumeric().withMessage('Area must be a number')
    ],
    async (req: express.Request, res: express.Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const property = await Property.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            );

            if (!property) {
                return res.status(404).json({ message: 'Property not found' });
            }

            await cacheService.clearPattern('properties:*');

            res.json(property);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete property
router.delete('/:id',
    auth,
    checkPropertyOwnership,
    async (req: express.Request, res: express.Response) => {
        try {
            const property = await Property.findByIdAndDelete(req.params.id);

            if (!property) {
                return res.status(404).json({ message: 'Property not found' });
            }

            await cacheService.clearPattern('properties:*');

            res.json({ message: 'Property deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router; 