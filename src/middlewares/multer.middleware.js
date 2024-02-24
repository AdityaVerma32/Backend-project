import multer from "multer";


// there are two ways to store
// Either u store on disk or in memory
const storage = multer.diskStorage({

    // the destination where file must be saved 
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },

    // configuration of the file after saving
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({ storage: storage })