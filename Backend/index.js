require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const ConnectDB = require('./Mongo/db')
const authRoutes = require('./routes/auth')
const { Server } = require('socket.io')
const { createServer } = require('node:http')
const { socketConnection } = require('./config/socket')

const app = express()
const server = createServer(app) // NOTE: no "new" — createServer is a factory function, not a class

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
})

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.use(express.json())
app.use('/', authRoutes)

// ---- Socket.io auth middleware --------------------------------------------
// Runs before "connection" fires. Verifies the JWT the client sent in
// `auth: { token }` and attaches the decoded userId to the socket.
// If this fails, the client never reaches io.on("connection") at all.
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token

        if (!token) {
            return next(new Error("Authentication error: no token provided"))
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        // console.log(decoded)
        socket.userId = decoded.userId // adjust this field name to match whatever key you sign the JWT with

        next()
    } catch (err) {
        next(new Error("Authentication error: invalid or expired token"))
    }
})

// ---- Presence tracking ------------------------------------------------------
// Map of userId -> Set of socket ids. A Set (not a single id) matters because
// one user can have multiple sockets open (two tabs, phone + web, etc.) — we
// only want to say they're "offline" once ALL of their sockets disconnect.
const onlineUsers = new Map()

io.on("connection", async (socket) => {
    const userId = socket.userId
    // console.log(userId)

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set())
    }

    onlineUsers.get(userId).add(socket.id)

    // Only broadcast "user:online" the first time this user connects —
    // opening a 2nd tab shouldn't re-announce them as newly online.
    if (onlineUsers.get(userId).size === 1) {
        io.emit("user:online", { userId })
    }

    // The newly-connected client missed every "user:online" event that fired
    // before it connected, so give it a full snapshot of who's online right now.
    socket.emit("onlineUsers:init", Array.from(onlineUsers.keys()))

    socketConnection({ socket, onlineUsers, io })
    // socket.on("message",(data)=>{
    //     console.log(data)
    // })

    socket.on("disconnect", () => {
        const sockets = onlineUsers.get(userId)
        if (!sockets) return

        sockets.delete(socket.id)

        if (sockets.size === 0) {
            onlineUsers.delete(userId)
            io.emit("user:offline", { userId })
        }
    })
})

const PORT = process.env.PORT || 3000

ConnectDB()
    .then(() => {
        console.log('✅ MongoDB connected')
        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`)
        })
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message)
        process.exit(1)
    })