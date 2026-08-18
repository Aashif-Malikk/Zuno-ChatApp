const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const varifyToken = require('../middleware/tokenMiddleware');
const { upload, audioUpload } = require('../middleware/multer');
// const audioUpload = require('../middleware/multer');

// const handleUpload = (req, res, next) => {
//     upload.single('image')(req, res, (err) => {
//         if (err) {
//             return res.status(400).json({ msg: err.message || 'Upload failed' })
//         }
//         next()
//     })
// }

router.post('/auth/signup', authController.userRegister);
router.post('/auth/login', authController.userLogin);
router.post('/logout', varifyToken, authController.userLogout);

router.get('/get-users', varifyToken, userController.getAllUsers);
router.get('/profile', varifyToken, userController.getProfile);
router.get('/indexData', varifyToken, userController.getAllIndexPageData);
// router.get('/friends', varifyToken, userController.getAllFriends);
router.post('/friend-requests', varifyToken, userController.getFriendRequests);
router.post('/add-friend', varifyToken, userController.addFriend);
router.post('/accept-request', varifyToken, userController.acceptFriendRequest);
router.post('/delete-request', varifyToken, userController.deleteFriendRequest);
router.post('/chatPerson', varifyToken, userController.chatPerson);
router.post('/upload-image', varifyToken, upload.single("image"), userController.getImageUrl);
router.post('/upload-audio', varifyToken, (req, res, next) => {
  audioUpload.single("audio")(req, res, (err) => {
    if (err) {
      console.error("Audio multer/storage error:", err);
      return res.status(400).json({ success: false, message: err.message || "Audio upload failed" });
    }
    next();
  });
}, userController.uploadAudio)

// ---- NO-AUTH test route — remove after confirming upload works ----
router.post('/test-audio-upload', (req, res, next) => {
  audioUpload.single("audio")(req, res, (err) => {
    if (err) {
      console.error("TEST audio multer/storage error:", err);
      return res.status(400).json({ success: false, message: err.message || "Upload failed" });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file received" });
  console.log("TEST upload req.file:", JSON.stringify(req.file, null, 2));
  const url = req.file.path || req.file.secure_url;
  return res.status(200).json({ success: true, url });
});

module.exports = router;