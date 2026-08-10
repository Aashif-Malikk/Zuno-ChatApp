const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const varifyToken = require('../middleware/tokenMiddleware');
const upload = require('../middleware/multer');

const handleUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ msg: err.message || 'Upload failed' })
        }
        next()
    })
}

router.post('/auth/signup', authController.userRegister);
router.post('/auth/login', authController.userLogin);
router.post('/logout', varifyToken, authController.userLogout);

router.get('/get-users', varifyToken, userController.getAllUsers);
router.get('/profile', varifyToken, userController.getProfile);
router.get('/my-friends', varifyToken, userController.getMyFriends);
// router.get('/friends', varifyToken, userController.getAllFriends);
router.post('/friend-requests', varifyToken, userController.getFriendRequests);
router.post('/add-friend', varifyToken, userController.addFriend);
router.post('/accept-request', varifyToken, userController.acceptFriendRequest);
router.post('/delete-request', varifyToken, userController.deleteFriendRequest);

module.exports = router;