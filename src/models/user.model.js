import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        unique:true,
        lowercase:true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique:true,
        lowercase:true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        lowercase:true,
        trim: true,
    },
    avatar: {
        type: String,   // cloudinary url
        required: true,
    },
    coverImage:{
        type:String,     // cloudinary url
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Vedio"
    }],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type: String
    }

}, { timestamps: true })


// this is middleware to encrypt the password
// password will only be encrypted when it is modified  by the user
// after that next function will be executed 
// 10 defines the hash rounds
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password,10);
        next();
    }
})

// this method is made to check if the password is correct or not
// mongoose supports making of methods by user using syntax 
// - userSchema.methods.methodName 
// returns true or false
userSchema.methods.isPasswordCorrect = async function(password){
    await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateAccessToken = function(){
    // PAYLOAD DATA that will get updated
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);