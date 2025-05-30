import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
    sender: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    message?: string;
    isRead: boolean;
    createdAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    message: {
        type: String,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
recommendationSchema.index({ recipient: 1, isRead: 1 });
recommendationSchema.index({ sender: 1 });
recommendationSchema.index({ property: 1 });

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema); 