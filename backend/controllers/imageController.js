const cloudinary = require("../config/cloudinary");
const Image = require("../models/Image");
const fs = require("fs");

exports.uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);

    const image = new Image({
      title: req.body.title || "Untitled",
      imageUrl: result.secure_url,
      isScreenshot: req.body.isScreenshot === "true",
      isWebcam: req.body.isWebcam === "true",
      isPhoneInFront: req.body.isPhoneInFront === "true",
      isOtherPersonInFront: req.body.isOtherPersonInFront === "true",
    });

    await image.save();
    fs.unlinkSync(req.file.path); // cleanup temp file

    res.json({ success: true, image });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};
