const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;

    if (!connUri) {
      console.warn('⚠️  WARNING: MONGODB_URI is not set in your .env file!');
      console.warn('👉 Please create or edit .env and set MONGODB_URI=your_mongodb_connection_string');
      return null;
    }

    const conn = await mongoose.connect(connUri);
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('💡 Tip: Ensure your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas Network Access.');
    // Don't crash entire server during hackathon development if DB isn't configured yet
    return null;
  }
};

module.exports = connectDB;
