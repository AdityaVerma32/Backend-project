import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateUserAvatar,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
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

router.route("/refresh-token").post(
    refreshAccessToken
)

router.route("/change-password").post(
    verifyJWT,
    changeCurrentPassword
)

router.route("/current-user").get(
    verifyJWT,
    getCurrentUser
)

router.route("/update-account").patch(
    verifyJWT,
    updateAccountDetails
)

// patch is used for updating
router.route("/updateAvatar").patch(
    verifyJWT,
    upload.single('avatar'),
    updateUserAvatar
)

router.route("/updatecoverimage").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

router.route("/c/:username").get(
    verifyJWT,
    getUserChannelProfile
)

router.route("/watchhistory").get(
    verifyJWT,
    getWatchHistory
)

export default router