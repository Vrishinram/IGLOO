const mongoose = require('mongoose');

const FALLBACK_URI = 'mongodb+srv://aura_admin:AuraGlue2026!@cluster0.pn85vyp.mongodb.net/glue?retryWrites=true&w=majority&appName=Cluster0';

function getMongoUri() {
  let uri = process.env.MONGODB_URI;
  if (!uri || typeof uri !== 'string') {
    return FALLBACK_URI;
  }
  uri = uri.trim();
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.slice(12).trim();
  }
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.warn('Configured MONGODB_URI has invalid scheme, using working fallback Atlas URI.');
    return FALLBACK_URI;
  }
  return uri;
}

const MONGODB_URI = getMongoUri();

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log(`MongoDB Connected to Atlas (${mongooseInstance.connection.host})`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('Error connecting to MongoDB Atlas:', error.message);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
