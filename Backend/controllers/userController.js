const cloudinary = require("../config/cloudinary");
const { User, Message } = require("../Mongo/Schema");

exports.getAllUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        const allUsers = await User.find({
            _id: {
                $ne: userId,
                $nin: user.friends,
            },
        }).select("-password -email -phone -createdAt -updatedAt -dob");

        return res.status(200).json({ success: true, users: allUsers });
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
}

exports.getProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-password'); // Exclude password field

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching profile" });
    }
}

exports.addFriend = async (req, res) => {
    try {
        const userId = req.userId;
        const { _id: friendId } = req.body;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            return res.status(404).json({ success: true, message: "User not found" });
        }

        if (user.friends.includes(friendId)) {
            return res.json({ message: "already friends" })
        }

        await User.findByIdAndUpdate(userId, {
            $addToSet: {
                friendRequestsSent: friendId,
            },
        });

        await User.findByIdAndUpdate(friendId, {
            $addToSet: {
                friendRequestsReceived: userId,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Friend request sent successfully",
        });

        return res.status(200).json({ success: true, message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Add friend error:", error);
        return res.status(500).json({ success: false, message: "Error adding friend" });
    }
}

exports.acceptFriendRequest = async (req, res) => {
    try {
        const userId = req.userId; // User B
        const { _id: friendId } = req.body; // User A

        await User.findByIdAndUpdate(userId, {
            $addToSet: {
                friends: friendId,
            },
            $pull: {
                friendRequestsReceived: friendId,
            },
        });

        await User.findByIdAndUpdate(friendId, {
            $addToSet: {
                friends: userId,
            },
            $pull: {
                friendRequestsSent: userId,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Friend request accepted",
        });

    } catch (error) {
        console.error("Accept request error:", error);

        return res.status(500).json({
            success: false,
            message: "Error accepting friend request",
        });
    }
};

exports.deleteFriendRequest = async (req, res) => {
    try {
        const userId = req.userId; // User B
        const { _id: friendId } = req.body; // User A

        await User.findByIdAndUpdate(userId, {
            $pull: {
                friendRequestsReceived: friendId,
            },
        });

        await User.findByIdAndUpdate(friendId, {
            $pull: {
                friendRequestsSent: userId,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Friend request deleted",
        });

    } catch (error) {
        console.error("Delete request error:", error);

        return res.status(500).json({
            success: false,
            message: "Error deleting friend request",
        });
    }
}

exports.getAllIndexPageData = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId)
            .populate('friends', 'name email _id avatar');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const friendsWithLastMessage = await Promise.all(
            user.friends.map(async (friend) => {

                const lastMessage = await Message.findOne({
                    $or: [
                        {
                            senderId: userId,
                            receiverId: friend._id,
                        },
                        {
                            senderId: friend._id,
                            receiverId: userId,
                        },
                    ],
                }).sort({ createdAt: -1 });

                const unseenCount = await Message.countDocuments({
                    senderId: friend._id,
                    receiverId: userId,
                    status: { $ne: "seen" },
                });

                return {
                    ...friend.toObject(),
                    lastMessage: lastMessage || null,
                    unseenCount,
                };
            })
        );

        return res.status(200).json({
            success: true,
            friends: friendsWithLastMessage,
            friendRequestsReceived: user.friendRequestsReceived
        });
    } catch (error) {
        console.error("Get friends error:", error);
        return res.status(500).json({ success: false, message: "Error fetching friends" });
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestIds } = req.body

        const usersThatSendRequest = await User.find({
            _id: { $in: requestIds }
        }).select('-password -email -phone -createdAt -updatedAt -dob -friendRequestsReceived -friendRequestsSent -friends');

        // console.log(usersThatSendRequest)
        return res.status(200).json({ success: true, usersThatSendRequest: usersThatSendRequest });

    } catch (error) {
        console.error("Get friend requests error:", error);
        return res.status(500).json({ success: false, message: "Error fetching friend requests" });
    }
};

exports.chatPerson = async (req, res) => {
    try {
        const { receiverId, senderId } = req.body
        const user = await User.findById(receiverId).select("-password -email -phone -createdAt -updatedAt -dob -friends -friendRequestsSent -friendRequestsReceived")
        const olderChats = await Message.find({
            $or: [
                {
                    senderId: senderId,
                    receiverId: receiverId,
                },
                {
                    senderId: receiverId,
                    receiverId: senderId,
                },
            ],
        }).sort({ createdAt: 1 });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!olderChats) {
            return res.json({ message: "Start Chatting" })
        }

        return res.status(200).json({ success: true, person: user, previousChats: olderChats });
    } catch (error) {
        console.error("Get Chat Person error:", error);
        return res.status(500).json({ success: false, message: "Error fetching Person" });
    }
}

exports.getImageUrl = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded",
            });
        }

        const result = await cloudinary.uploader.upload(
            req.file.path,
            { folder: "Zuno/ChatImage" }
        );

        return res.status(200).json({
            success: true,
            url: result.secure_url,
        });

    } catch (error) {
        // FIX: log the REAL underlying error, not just a generic message —
        // Cloudinary/multer errors get swallowed otherwise, and you're
        // stuck guessing what actually failed.
        console.error("Cloudinary upload error:", error.message, error);

        return res.status(500).json({
            success: false,
            message: "Image upload failed",
            // Only include this in development — don't leak internals in prod:
            detail: process.env.NODE_ENV !== "production" ? error.message : undefined,
        });
    }
}

exports.uploadAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No audio uploaded",
            });
        }

        // multer-storage-cloudinary sets req.file.path to the Cloudinary secure_url
        console.log("Uploaded audio file:", JSON.stringify(req.file, null, 2));

        const url = req.file.path || req.file.secure_url;

        return res.status(200).json({
            success: true,
            url,
        });

    } catch (error) {
        console.error("Audio upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Audio upload failed",
            detail: process.env.NODE_ENV !== "production" ? error.message : undefined,
        });
    }
};

