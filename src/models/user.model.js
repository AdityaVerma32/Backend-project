import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiErrors } from "../utils/ApiErrors.js";

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    avatar: {
        type: String,   // cloudinary url
        required: true,
    },
    coverImage: {
        type: String,     // cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Vedio"
    }],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }

}, { timestamps: true })


// this is middleware to encrypt the password
// password will only be encrypted when it is modified  by the user
// after that next function will be executed 
// 10 defines the hash rounds

//-----------------How do the mongoose know on which entry we are working upon?----------------- 

// In Mongoose, when you define a schema for a model, each document created based on that schema has its own properties. 
// When you call methods like save() on a document, Mongoose knows which document you're working with because you're
// invoking the method on a specific document instance.
// When you call save() on a specific user document, Mongoose internally knows that the middleware function you've
// defined applies to that specific document. The this keyword within the middleware function refers to the document
// instance on which you're calling save(). So, when you check this.isModified('password'), you're checking whether the 
// "password" field of the specific user document you're trying to save has been modified.
userSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) return next();

        this.password = await bcrypt.hash(this.password, 10)
        next();
    } catch (error) {
        throw new ApiErrors(400, "BCRYPT Error 😢")
    }
})

// this method is made to check if the password is correct or not
// mongoose supports making of methods by user using syntax 
// - userSchema.methods.methodName 
// returns true or false



userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,  // PAYLOAD DATA that will get added to JWT Token
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);