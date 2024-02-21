import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VedioSchema = new Schema({
    vedioFile: {
        type: String, // clouodinary url
        required: true,        
    },
    thumbnail:{
        type: String,   // cloudinary url
        required: true,
    },
    title:{
        type: String,
        required: true, //cloudinary url
    },
    description:{
        type: String,
        required: true,
    },duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

VedioSchema.plugin(mongooseAggregatePaginate);


export const Vedio = mongoose.model("Vedio", VedioSchema)