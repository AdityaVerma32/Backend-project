import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        vedio: {
            type: Schema.Types.ObjectId,
            ref: "Vedio"
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const Like = mongoose.model("Like", likeSchema)