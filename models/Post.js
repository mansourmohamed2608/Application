const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  reacts: {
    type: Map,
    of: Number,
    default: {},
  },
  replies: [this], // This allows nesting replies
  date: {
    type: Date,
    default: Date.now,
  },
});

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  reacts: {
    type: Map,
    of: Number,
    default: {},
  },
  replies: [ReplySchema],
  date: {
    type: Date,
    default: Date.now,
  },
});

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  reacts: {
    type: Map,
    of: Number,
    default: {},
  },
  comments: [CommentSchema],
  location: {
    type: {
      type: String,
      enum: ["Point"], // 'location.type' must be 'Point'
      required: true,
    },
    coordinates: {
      type: [Number], // Array of numbers [longitude, latitude]
      required: true,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
});

// Create a geospatial index on the location field
PostSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Post", PostSchema);
