const express = require("express");
const router = express.Router();
const Image = require("../models/Image");

router.get("/insert-test", async (req, res) => {
  try {
    const newImage = new Image({
      title: "Test Image",
      imageUrl: "https://dummyurl.com/image.jpg",
      webcam: true,
      screenshot: false,
      phoneInFront: true,
      personInFront: false,
    });

    await newImage.save();
    res.json({ success: true, message: "Image inserted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
