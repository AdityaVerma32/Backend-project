import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    vedio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "vedio",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }

}, {
    timestamps: true
})

commendSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema)