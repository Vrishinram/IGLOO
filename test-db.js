require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  console.log('\n🔍 Testing MongoDB Atlas Connection for Project GLUE (Team AURA)...');
  console.log('-------------------------------------------------------------');

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file!');
    console.log('👉 Make sure you have a .env file with:');
    console.log('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/glue?retryWrites=true&w=majority\n');
    process.exit(1);
  }

  // Mask password for safe logging
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
  console.log(`📡 Connecting to: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri);
    console.log('✅ SUCCESS: Connected to MongoDB successfully!');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database Name: ${conn.connection.name}`);
    console.log(`   Connection State: Ready (1)\n`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Failed:');
    console.error(`   Error message: ${error.message}\n`);
    console.log('💡 Hackathon Troubleshooting Checklist:');
    console.log('   1. IP Whitelist: In Atlas, go to "Network Access" -> ensure 0.0.0.0/0 (Allow Access from Anywhere) is added.');
    console.log('   2. Password: Did you replace <db_password> with your actual database user password?');
    console.log('   3. URL Encoding: If your password contains special characters (like @, #, $, %), URL-encode them or use an alphanumeric password.');
    console.log('   4. User permissions: Ensure the Database User has "Read and write to any database" privileges.\n');
    process.exit(1);
  }
}

testConnection();
