import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://quang20042204_db_user:RCmoQVsL9hZnMFjJ@cluster0.asizqsh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in Vercel Environment Variables");
}

// Cache trong cùng một Vercel function instance
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function ConnectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected:", cached.conn.connection.host);
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}
