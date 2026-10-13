import mongoose from "mongoose";
import dns from "node:dns";

const connectWithDnsFallback = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        const isSrvDnsRefused = process.env.MONGO_URI.startsWith("mongodb+srv://")
            && error.code === "ECONNREFUSED"
            && error.hostname?.startsWith("_mongodb._tcp.");

        if (!isSrvDnsRefused) throw error;

        console.warn("MongoDB SRV lookup was refused by system DNS; retrying with public DNS.");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        await mongoose.connect(process.env.MONGO_URI);
    }
};

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is required");
        }

        await connectWithDnsFallback();

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        throw error;
    }
};

export default connectDB;
 