import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Property } from '../models/Property';

interface AuthRequest extends Request {
    user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        const user = await User.findOne({ _id: (decoded as any)._id });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate.' });
    }
};

export const checkPropertyOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        if (property.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to perform this action' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}; 