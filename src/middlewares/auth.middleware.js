import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req,_, next) => {
    try {
        // we either take accessToken from cookies or from http header(In case of mobile application)
        console.log(req.cookies)

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiErrors(401, "Unauthorized access")
        }

        const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiErrors(401, "Invalid Access Token")
        }

        req.user = user;
        console.log("\nUser Verified\n")
        next();
    } catch (err) {
        throw new ApiErrors(401, err.message || "Invalid Access Token")
    }
})