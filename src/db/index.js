// 
import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
    try {
        const connectionINstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionINstance.connection.host}`);
    } catch (err) {
        console.error("\n MONGODB Connection FAILED: ", err)
        process.exit(1)
    }
}

export default connectDB