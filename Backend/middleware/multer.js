const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Image storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Zuno/ChatImage",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  },
});

// Audio storage — params MUST be a function when using resource_type
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "Zuno/voice-messages",
    resource_type: "video",   // Cloudinary stores audio under 'video'
    allowed_formats: ["m4a", "mp3", "wav", "aac","mp4"],
    public_id: `audio-${Date.now()}`,
  }),
});

const upload = multer({
  storage,
});

const audioUpload = multer({
  storage: audioStorage,
});

module.exports = {
  upload,
  audioUpload,
};