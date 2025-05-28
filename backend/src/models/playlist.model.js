import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  cretedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  description: {
    type: String,
    default: "",
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Playlist", playlistSchema);
