const mongoose = require("mongoose");
const { mongoUri } = require("./config");

async function connectDatabase() {
  let uri = mongoUri;
  if (!uri) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const memory = await MongoMemoryServer.create();
    uri = memory.getUri();
    console.log("MongoDB is not configured. Using an in-memory database for this session.");
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = { connectDatabase };
