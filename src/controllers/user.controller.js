import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        // accesstoken is given to user but refresh token is saved into database 
        // whenever user wish to access the db refresh token  of both db ans user is compared
        // if the those are eqal then access is grated and access token is changed

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });    // mongoose models also kicked when we call save

        return { accessToken, refreshToken }
    } catch (err) {
        throw new ApiError(500, "Server Error");
    }
}

//--------------ALGORITHM for registration--------------------------
// Step 1: Get User details from frontend(According to user.model)
// Step 2: Validation (Als done at frontEnd)
// Step 3: Check if User Exist(Either using username or email or Both)
// Step 4: Check for Image and avtar
// Step 5: upload them to cloudinary server
// Step 6: Create user Object (Create User entry in DB)
// Step 7: Remove password and refresh Token from response (Once passsword is shared by the user through req it
//                                                           should not be sent back to response)
// Step 8: check for user creation  
// Step 9: return res

// NOTE: After performing every task we are checking for its success

const registerUser = asyncHandler(async (req, res) => {

    // Step 1: Get User details from frontend(According to user.model)
    const { fullname, username, email, password } = req.body
    console.log("\n", req.body)
    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiErrors(400, "Please fill all the fields");
    }
    console.log("Step 2 completed ");

    // Step 3: Check if User Exist(Either using username or email or Both)
    const existedUser = await User.findOne({
        $or: [
            { username },
            { email },
        ]
    })

    const avatarLocalPath = req.files?.avatar[0].path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        console.log("Inside if block")
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (existedUser) {
        if (avatarLocalPath) {
            fs.unlinkSync(avatarLocalPath);
        }
        if (coverImageLocalPath) {
            fs.unlinkSync(coverImageLocalPath);
        }
        throw new ApiErrors(409, "User Already Exist with same Username or Email!!")
    }
    console.log("Step 3 completed ");

    // Step 4: check for image and avatar 
    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Please upload an avatar");
    }
    console.log("Step 4 completed ");

    // Step 5: Upload the image to the cloudinary server
    const avatar = await uploadOncloudinary(avatarLocalPath);
    const coverImage = await uploadOncloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiErrors(400, "Please upload an avatar");
    }
    console.log("Step 5 completed ");

    // Step 6: Create user Object (Create User entry in DB)
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : "",
        email,
        password,
        username: username.toLowerCase()
    })
    console.log("Step 6 completed ");

    // Step 7: Remove password and refresh Token from response & checking if the user is registered
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"   // By default all fields are checked so - sign will remove 
        // these fields when it will return the response
    )
    console.log("Step 7 completed ");

    // Step 8: check for user creation
    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while creating a new user")
    }
    console.log("Step 8 completed ");

    // Step 9: return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
})

//--------------ALGORITHM for registration--------------------------
// Step 1: Fetch username and password from req
// Step 2: Check if both the feilds are filled
// Step 3: check if username and password exist in the database
// Step 4: generate access token and refresh token
// Step 5: send cookie 

const loginUser = asyncHandler(async (req, res) => {

    // Step 1: fetch username and password from request body
    const { username, password } = req.body;
    console.log("Step 1 completed!")

    // Step 2: check if username and password are filled
    if (!username) {
        throw new ApiErrors(400, "Usename or Email required");
    }
    console.log("Step 2 completed!")    

    // Step 3: Check if username/Email Exist in Database
    const user = await User.findOne({
        username
    })
    if (!user) {
        throw new ApiErrors(401, "User does not exists");
    }
    console.log("Step 3 completed!")

    // Step 4: Check if password is correct 
    // method defined in user.model 
    const passwordValidation = await user.isPasswordCorrect(password);
    if (!passwordValidation) {
        throw new ApiErrors(400, "Invalid password")
    }
    console.log("Step 4 completed!")

    // Step 5: generate access token and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    console.log("Step 5 completed!")

    // Step 6: Sending cookies
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"   
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .cookie("UserName : ",user.fullname,{})         // extra line 
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User Logged In Successfully! fcuk u"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User Logged Out Successfully")
        )

})

export { registerUser, loginUser, logoutUser}