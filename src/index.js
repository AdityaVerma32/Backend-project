// used only for listening on port after getting connected to database 

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
dotenv.config({
    path: ".env"
});

connectDB().then(
    ()=>{
        app.on("error",(error)=>{
            console.log("ERRR index/src : ",error);
            throw error
        })
        app.listen(process.env.PORT || 8000 ,()=>{
        console.log("Server is listening on port " + process.env.PORT)
    });
        
    }
).catch((err)=>{
    console.log("Mongo DB Connections Failed", err)
});


// import express from "express";
// const app=express()

// //immediatly execute the code ie IFI
// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error",()=>{
//             console.log("Error",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     }catch(error){
//         console.log("Error" ,error)
//         throw error
//     }
// })()