import express from 'express';
import { Favorite } from '../models/Favorite';
import { Property } from '../models/Property';
import { auth } from '../middleware/auth';
import { cacheService } from '../services/cache';

const router = express.Router();

// Add property to favorites
router.post('/:propertyId', auth, async (req: any, res: express.Response) => {
    try {
        const property = await Property.findById(req.params.propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const favorite = new Favorite({
            user: req.user._id,
            property: req.params.propertyId
        });

        await favorite.save();
        await cacheService.clearPattern(`favorites:${req.user._id}:*`);

        res.status(201).json(favorite);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Property already in favorites' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's favorite properties
router.get('/', auth, async (req: any, res: express.Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Try to get from cache first
        const cacheKey = `favorites:${req.user._id}:${page}:${limit}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const favorites = await Favorite.find({ user: req.user._id })
            .populate({
                path: 'property',
                populate: {
                    path: 'createdBy',
                    select: 'name email'
                }
            })
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Favorite.countDocuments({ user: req.user._id });

        const result = {
            favorites,
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

// Remove property from favorites
router.delete('/:propertyId', auth, async (req: any, res: express.Response) => {
    try {
        const favorite = await Favorite.findOneAndDelete({
            user: req.user._id,
            property: req.params.propertyId
        });

        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        await cacheService.clearPattern(`favorites:${req.user._id}:*`);

        res.json({ message: 'Property removed from favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check if property is in favorites
router.get('/check/:propertyId', auth, async (req: any, res: express.Response) => {
    try {
        const favorite = await Favorite.findOne({
            user: req.user._id,
            property: req.params.propertyId
        });

        res.json({ isFavorite: !!favorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 