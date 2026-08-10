const { User } = require("../Mongo/Schema");

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

exports.getMyFriends = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).populate('friends', 'name email _id avatar');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, friends: user.friends, friendRequestsReceived: user.friendRequestsReceived });
    } catch (error) {
        console.error("Get friends error:", error);
        return res.status(500).json({ success: false, message: "Error fetching friends" });
    }
};

// exports.getAllFriends = async (req, res) => {
//     try {
//         const userId = req.userId;

//         const user = await User.findById(userId).populate('friends', 'name email avatar _id');

//         console.log(user.friends)
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         return res.status(200).json({ success: true, friends: user.friends, friendRequestsReceived: user.friendRequestsReceived });
//     } catch (error) {
//         console.error("Get friends error:", error);
//         return res.status(500).json({ success: false, message: "Error fetching friends" });
//     }
// }

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

