const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/dbconnect';
    const conn = await mongoose.connect(uri, {
      // These options are no longer needed in newer versions of mongoose
      // but keeping them for compatibility
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Mongoose disconnected');
});

// Close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📡 MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;