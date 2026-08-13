const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, },
        uniqueId: { type: String, unique: true, required: true, },
        email: { type: String, unique: true, required: true, lowercase: true },
        password: { type: String, required: true },
        isloggedin: { type: Boolean, default: false },
        phone: { type: String, required: true },
        gender: { type: String, default: 'Not Specified' },
        dob: { type: String, default: '1995-06-15' },
        avatar: { type: String, default: 'https://res.cloudinary.com/dnv3h43cq/image/upload/v1786264104/DPdefault_image_tp0m9c.jpg' },
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        friendRequestsSent: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        friendRequestsReceived: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);


const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // chatId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Chat",
    //     required: true,
    // },

    message: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent",
    },

    time: {
        type: String,
        default: "No time"
    },

    type: {
        type: String,
        default: "text"
    },

    seenAt: {
        type: Date,
        default: null
    }
});

module.exports = {
    User: mongoose.model("User", userSchema),
    Message: mongoose.model("Message", messageSchema)
}