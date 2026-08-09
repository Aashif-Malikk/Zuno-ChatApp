require('dotenv').config()
const express = require('express')
const cors = require('cors')
const ConnectDB = require('./Mongo/db')
const authRoutes = require('./routes/auth')

const app = express()

// app.set('trust proxy', 1)

app.use(cors({
    origin: "*",
    methods: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type","Authorization"],
}))

// app.use(cors())
app.use(express.json())
app.use('/', authRoutes)

const PORT = process.env.PORT || 3000

ConnectDB()
    .then(() => {
        console.log('✅ MongoDB connected')
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`)
        })
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message)
        process.exit(1)
    })