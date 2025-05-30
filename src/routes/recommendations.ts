import express from 'express';
import { body, validationResult } from 'express-validator';
import { Recommendation } from '../models/Recommendation';
import { Property } from '../models/Property';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { cacheService } from '../services/cache';

const router = express.Router();

// Recommend a property to another user
router.post('/',
    auth,
    [
        body('propertyId').notEmpty().withMessage('Property ID is required'),
        body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
        body('message').optional().isString().withMessage('Message must be a string')
    ],
    async (req: any, res: express.Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { propertyId, recipientEmail, message } = req.body;

            // Check if property exists
            const property = await Property.findById(propertyId);
            if (!property) {
                return res.status(404).json({ message: 'Property not found' });
            }

            // Find recipient user
            const recipient = await User.findOne({ email: recipientEmail });
            if (!recipient) {
                return res.status(404).json({ message: 'Recipient user not found' });
            }

            // Don't allow self-recommendation
            if (recipient._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'Cannot recommend to yourself' });
            }

            const recommendation = new Recommendation({
                sender: req.user._id,
                recipient: recipient._id,
                property: propertyId,
                message
            });

            await recommendation.save();
            await cacheService.clearPattern(`recommendations:${recipient._id}:*`);

            res.status(201).json(recommendation);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Get recommendations received by the current user
router.get('/received', auth, async (req: any, res: express.Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Try to get from cache first
        const cacheKey = `recommendations:${req.user._id}:received:${page}:${limit}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const recommendations = await Recommendation.find({ recipient: req.user._id })
            .populate({
                path: 'property',
                populate: {
                    path: 'createdBy',
                    select: 'name email'
                }
            })
            .populate('sender', 'name email')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Recommendation.countDocuments({ recipient: req.user._id });

        const result = {
            recommendations,
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

// Get recommendations sent by the current user
router.get('/sent', auth, async (req: any, res: express.Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Try to get from cache first
        const cacheKey = `recommendations:${req.user._id}:sent:${page}:${limit}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const recommendations = await Recommendation.find({ sender: req.user._id })
            .populate({
                path: 'property',
                populate: {
                    path: 'createdBy',
                    select: 'name email'
                }
            })
            .populate('recipient', 'name email')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Recommendation.countDocuments({ sender: req.user._id });

        const result = {
            recommendations,
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

// Mark recommendation as read
router.patch('/:id/read', auth, async (req: any, res: express.Response) => {
    try {
        const recommendation = await Recommendation.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            { isRead: true },
            { new: true }
        );

        if (!recommendation) {
            return res.status(404).json({ message: 'Recommendation not found' });
        }

        await cacheService.clearPattern(`recommendations:${req.user._id}:*`);

        res.json(recommendation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete recommendation
router.delete('/:id', auth, async (req: any, res: express.Response) => {
    try {
        const recommendation = await Recommendation.findOneAndDelete({
            _id: req.params.id,
            $or: [
                { sender: req.user._id },
                { recipient: req.user._id }
            ]
        });

        if (!recommendation) {
            return res.status(404).json({ message: 'Recommendation not found' });
        }

        await cacheService.clearPattern(`recommendations:${req.user._id}:*`);
        await cacheService.clearPattern(`recommendations:${(recommendation as any).recipient}:*`);

        res.json({ message: 'Recommendation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 