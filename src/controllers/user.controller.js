import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { channel } from "diagnostics_channel";
import { lookup } from "dns";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
        throw new ApiErrors(500, "Server Error");
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

    // Step 4: check for image and avatar 
    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Please upload an avatar");
    }

    // Step 5: Upload the image to the cloudinary server
    const avatar = await uploadOncloudinary(avatarLocalPath);
    const coverImage = await uploadOncloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiErrors(400, "Please upload an avatar");
    }

    // Step 6: Create user Object (Create User entry in DB)
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : "",
        email,
        password,
        username: username.toLowerCase()
    })

    // Step 7: Remove password and refresh Token from response & checking if the user is registered
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // Step 8: check for user creation
    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while creating a new user")
    }

    // Step 9: return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully 😊")
    )
})

//--------------ALGORITHM for Login--------------------------
// Step 1: Fetch username and password from req
// Step 2: Check if both the feilds are filled
// Step 3: check if username and password exist in the database
// Step 4: generate access token and refresh token
// Step 5: send cookie 

const loginUser = asyncHandler(async (req, res) => {

    // Step 1: fetch username and password from request body
    const { username, password } = req.body;

    // Step 2: check if username and password are filled
    if (!username) {
        throw new ApiErrors(400, "Usename or Email required");
    }

    // Step 3: Check if username/Email Exist in Database
    const user = await User.findOne({
        username
    })
    if (!user) {
        throw new ApiErrors(401, "User does not exists");
    }

    // Step 4: Check if password is correct 
    const passwordValidation = await user.isPasswordCorrect(password);
    if (!passwordValidation) {
        throw new ApiErrors(400, "Invalid password")
    }

    // Step 5: generate access token and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

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
        .cookie("UserName : ", user.fullname, {})         // extra line 
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
                refreshToken: null
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiErrors(401, "Unauthorized Access")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        console.log("I am here 😊")
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiErrors(401, "Unauthorized Access")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiErrors(401, "Refresh Token has Expired")
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToke", accessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .cookie("User", "Aditya verma", option)
            .json(
                new ApiResponse(
                    200,
                    { accessToken: accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed "
                )
            )
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid refresh Token")
    }
})

// user is able to changepassword only bcz he is already loggedIn 
// and if user is already logged in that means auth.middleware has run
// and in auth.middleware we have added users information to the request
// from there we can find the details about current user 
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiErrors(400, "Invalid Password")
    }
    user.password = newPassword
    await user.save({
        validateBeforeSave: false
    })
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password Changed Successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched Successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!(fullname || email)) {
        throw new ApiErrors(401, "Please fill the required Details")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Details updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const newAvatarLocalPath = req.file?.path;

    if (!newAvatarLocalPath) {
        throw new ApiErrors(400, "Avatar File is Missing")
    }

    const avatar = await uploadOncloudinary(newAvatarLocalPath)

    if (!avatar.url) {
        throw new ApiErrors(400, "Error while uploading avatar")
    }

    const lastAvatar = await User.findById(req.user?._id);
    const lastAvatarurl = lastAvatar ? lastAvatar.avatar : null;


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    const parts = lastAvatarurl.split('/'); // Split the URL string by '/'
    let lastPart = parts[parts.length - 1]; // Retrieve the last part of the array
    lastPart = lastPart.split('.')[0];

    cloudinary.uploader.destroy(lastPart, function (error, result) {
        if (error) {
            console.log("Earlier file could not be deleted from Cloud")
        }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Avatar Updates Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const newCoverImageLocalPath = req.file?.path;
    if (!newCoverImageLocalPath) {
        throw new ApiErrors(400, "Cover Image File is Missing")
    }

    const coverImage = await uploadOncloudinary(newCoverImageLocalPath)

    const lastCoverIMG = await User.findById(req.user?._id)
    const lastCoverIMGUrl = lastCoverIMG?.coverImage

    if (!coverImage.url) {
        throw new ApiErrors(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    const parts = lastCoverIMGUrl.split('/'); // Split the URL string by '/'
    let lastPart = parts[parts.length - 1]; // Retrieve the last part of the array
    lastPart = lastPart.split('.')[0];

    cloudinary.uploader.destroy(lastPart, function (error, result) {
        if (error) {
            console.log("Earlier file could not be deleted from Cloud!")
        }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "CoverImage Updates Successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;  // from url

    if (!username?.trim()) {
        throw new ApiErrors(400, "Please Select Username")
    }

    // aggregate function takes array of pipelines
    const Channel = User.aggregate([
        // selecting the user whose username is the one clicked by loggedInUser
        {
            $match: username?.toLowerCase()
        },
        // selecting subscribers of this user
        {
            // we wish to find the number of subscribers of this user, So we will find the users whose channel
            // id is equals to the id of this user, because channel are the user who has been subscribed by 
            // subscriber in subscription collection

            // select those entries whose channel id is equals to the current user
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // selecting those to whom this user has subscribed to 
        {
            // select those entries whose subscriber id is equals to the current user
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // adding totalsubscriber, channels whom this user has subscribed to, and a variable wheather the loggedin
        // user has subscribed to this user or not
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // selecting the details that need to be sent to the frontEnd
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedTo: 1,
                isSubscribed: 1,
                email: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    // channels is an Array of objects but in our case this array only contains one object
    if (!Channel?.length) {
        throw new ApiErrors(404, "Channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched Successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        // select the id of loggedIN user but mongoose wil convert it to id first
        // earlier mongoose was perfomring this task of converting internally
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // SELECT * FROM USER LEFTOUTERJOIN VEDIOS WHERE WATCHHOSTORY.ID=VEDIOS.ID 
        // and name this table as "watchHistory"
        {
            $lookup: {
                from: "vedios",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            ownerDetails: {
                                $first: "$ownerDetails"
                            }
                        }
                    }
                ]
            }
        },
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully")
        )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory }