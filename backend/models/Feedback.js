const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot be more than 1000 characters'],
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
FeedbackSchema.index({ event: 1, participant: 1 }, { unique: true });
FeedbackSchema.index({ event: 1, rating: 1 });

// Static method to calculate average rating for an event
FeedbackSchema.statics.getAverageRating = async function(eventId) {
  const result = await this.aggregate([
    {
      $match: { event: new mongoose.Types.ObjectId(eventId) }
    },
    {
      $group: {
        _id: '$event',
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length > 0) {
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    result[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalFeedbacks: result[0].totalFeedbacks,
      distribution
    };
  }

  return {
    averageRating: 0,
    totalFeedbacks: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
