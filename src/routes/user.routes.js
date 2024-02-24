import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// upload is middleware that runs before registerUSer is called to take photo input from the user
router.post("/register",
    upload.fields([
        {   
            name: "avatar", 
            maxCount: 1 
        },
        { 
            name: "coverImage",
            maxCount: 1 
        }
    ]), 
    registerUser)


export default router