import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
    user: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    }
}, {
    timestamps: true
});

// Create a compound index to ensure a user can't favorite the same property twice
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema); 