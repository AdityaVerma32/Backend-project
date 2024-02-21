//------------asyncHandler code using promises-----------------

const asyncHandler =(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

// -----------asyncHandler code using try-catch----------------

// const asynHandler = (fn) => async (req,res,next) => {
//     try{

//     }catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message : "Error Inside AsyncHandler" + error.message
//         })
//     }
// }

export {asynHandler}