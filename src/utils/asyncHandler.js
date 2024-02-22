// seperate module or process the request
//------------asyncHandler code using promises-----------------

const asyncHandler =(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}
export {asyncHandler}

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
