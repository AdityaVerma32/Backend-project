import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import {uploadOncloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";


//-------------------------ALGORITHM-------------------------------
// Step 1: Get User details from frontend(According to user.model)
// Step 2: Validation (Als done at frontEnd)
// Step 3: Check if User Exist(Either using username or email or Both)
// Step 4: Check for Image and avtar
// Step 5: upload them to cloudinary server
// Step 6: Create user Object (Create User entry in DB)
// Step 7: Remove password and refresh Token from response (Once passsword is shared by the user through req it
//                                                           should not sent back as response)
// Step 8: check for user creation  
// Step 9: return res

// NOTE: After performing every task we are checking for its success

const registerUser = asyncHandler(async (req, res) => {

    // Step 1: Get User details from frontend(According to user.model)
    const { fullname, username, email, password } = req.body
    console.log("\nStep 1 cmpleted \nEmail: ", email);
   // console.log('\x1b[31m', 'This text will be red'); 

    // Step 2: validations
    // for beginners but still good method to check for success
    // if(fullname ===""){
    //     throw new Error(400,"Full name is required");
    // }

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
    console.log("Outside if block")

    if(req.files  && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        console.log("Inside if block")
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    console.log("\nExisted Users Data : ")
    if(existedUser){
        if(avatarLocalPath){
            fs.unlinkSync(avatarLocalPath);
        }
        if(coverImageLocalPath){
            fs.unlinkSync(coverImageLocalPath);
        }
        throw new ApiErrors(409, "User Already Exist with same Username or Email!!")
        

    }
    console.log("Step 3 completed ");

    console.log(req.files)
    

    // Step 4: check for image and avatar 
    
    //coverImageLocalPath = req.files?.coverImage[0].path;
    


    if(!avatarLocalPath ){
        throw new ApiErrors(400, "Please upload an avatar");
    }    
    console.log("Step 4 completed ");


    // Step 5: Upload the image to the cloudinary server
    const avatar = await uploadOncloudinary(avatarLocalPath);
    const coverImage = await uploadOncloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiErrors(400, "Please upload an avatar");
    }
    console.log("Step 5 completed ");


    // Step 6: Create user Object (Create User entry in DB)
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?coverImage.url:"",
        email,
        password,
        username : username.toLowerCase()
    })
    console.log("Step 6 completed ");

    
    // Step 7: Remove password and refresh Token from response & checking if the user is registered
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"   // By default all fields are checked so - sign will remove 
                                    // these fields when it will return the response
    )
    console.log("Step 7 completed ");


    // Step 8: check for user creation
    if(!createdUser){
        throw new ApiErrors(500, "Something went wrong while creating a new user")
    }
    console.log("Step 8 completed ");


    // Step 9: return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered successfully")
    )
    console.log("Step 9 completed ");

    
})

export { registerUser }