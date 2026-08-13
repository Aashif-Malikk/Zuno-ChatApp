const { Message } = require("../Mongo/Schema");

exports.socketConnection = ({ socket, io, onlineUsers }) => {
    // ---- New message sent -------------------------------------------------
    socket.on("message", async ({ receiverId, message, outgoingMessage }) => {
        console.log("Message:", { receiverId, message });

        // Always store the message, even if the receiver is offline —
        // this is what makes "deliver later" work.
        const newMessage = await Message.create({
            senderId: socket.userId,
            receiverId,
            message,
            status: "sent",
            time: outgoingMessage.time,
        });

        const socketIds = onlineUsers.get(receiverId);

        if (!socketIds) {
            console.log("Receiver is offline");
            return; // message is safely in MongoDB — they'll see it when they open the chat
        }

        // Receiver is online right now — push it to every device/tab they have open.
        for (const socketId of socketIds) {
            io.to(socketId).emit("receive-message", {
                message,
                senderId: socket.userId,
                _id: newMessage._id,
                time: outgoingMessage.time,
                type: outgoingMessage.type || "text",
            });
        }
    });

    // ---- Mark messages as seen ---------------------------------------------
    // `senderId` = the person who ORIGINALLY SENT the messages being marked seen
    // `receiverId` = the person emitting this event, i.e. the one who just SAW them
    //
    // Fires from two places on the client:
    //   1. Right after the socket connects (catches messages that arrived
    //      while this user was offline)
    //   2. The instant a new message is received while the chat is open
    //      (real-time "seen" while both people are actively chatting)
    socket.on("message:seen", async ({ senderId, receiverId }) => {
        try {
            const updatedMessages = await Message.updateMany(
                {
                    senderId: senderId,
                    receiverId: receiverId,
                    status: { $ne: "seen" },
                },
                {
                    $set: {
                        status: "seen",
                        seenAt: new Date(),
                    },
                }
            );

            // console.log(`Marked ${updatedMessages.modifiedCount} messages as seen`);

            // Notify the ORIGINAL SENDER (not the person marking as seen) so
            // their UI can flip the checkmarks blue in real time.
            const senderSocketIds = onlineUsers.get(senderId);
            if (senderSocketIds) {
                for (const socketId of senderSocketIds) {
                    io.to(socketId).emit("message:marked-seen", {
                        senderId: senderId,
                        receiverId: receiverId,
                        seen: true,
                    });
                }
            }
        } catch (error) {
            console.error("Seen message error:", error);
        }
    });
};