import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// upload is middleware that runs before registerUSer is called to take photo input from the user
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),         // middleware by multer
    registerUser
)

router.route("/login").post(
    loginUser
)

router.route("/logout").post(
    verifyJWT,  // middleware by Aditya Verma {Backend Developer}
    logoutUser
)


export default router