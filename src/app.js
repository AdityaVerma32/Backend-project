import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

// ---------------- All the middle wares below-------------------------
// for entry of authorized user only
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// A middleware function that is used to parse JSON data sent in the request body
app.use(express.json({limit: "8kb"}));

// You NEED express.json() and express.urlencoded() for POST and PUT requests, because in both these requests 
// you are sending data (in the form of some data object) to the server and you are asking the server to accept 
// or store that data (object), which is enclosed in the body (i.e. req.body) of that (POST or PUT) Request
app.use(express.urlencoded({extended: true,limit: "8kb"}));
app.use(express.static("public"));
// access cookies of user and set them
app.use(cookieParser());

//----------------All the middle wares defined Above-----------------------

// Routes

import userRoutes from "./routes/user.routes.js";

// routes Declaration
// http://localhost:8000/api/v1/users
app.use("/api/v1/users",userRoutes);

export {app} 