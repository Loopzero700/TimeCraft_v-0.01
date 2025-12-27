import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("||.......DB is Connected......||");
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error:", err.message);
  process.exit(1);
});
mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected. Trying to reconnect...");
});

export default connectDB;
