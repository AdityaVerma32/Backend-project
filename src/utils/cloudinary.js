// before this the file has been uploaded to local server
// and now we are uploading the file on cloudinary

import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// uploading file on cloudinary server
const uploadOncloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        }
        )
        console.log("File has been Uploaded on Cloudinary : ", response.url);
        return response;
    } catch (e) {
        // remove the locally saved temporary file as the upload operation got failed 
        fs.unlinkSync(localFilePath); 
        return null;
     }
}


export {uploadOncloudinary}