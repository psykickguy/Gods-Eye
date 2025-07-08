const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  isScreenshot: Boolean,
  isWebcam: Boolean,
  isPhoneInFront: Boolean,
  isOtherPersonInFront: Boolean,
  detectedFaces: Number,
  deviceType: {
    type: String,
    enum: ["phone", "webcam", "unknown"],
    default: "unknown",
  },
  tags: [String],
  classifiedBy: {
    type: String,
    enum: ["manual", "auto"],
    default: "manual",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Image", imageSchema);
