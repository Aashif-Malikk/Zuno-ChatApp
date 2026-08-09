const mongoose = require('mongoose')
require('dotenv').config()

const DB_NAME = 'Zuno'

const ConnectDB = async () => {
  try {
    let uri = (process.env.MONGO_URL || '').trim()
    if (!uri) {
      throw new Error('MONGO_URL is missing in .env')
    }

    await mongoose.connect(uri, { dbName: DB_NAME })
    console.log(`MongoDB connected successfully (database: ${DB_NAME})`)
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  }
}

module.exports = ConnectDB
