import mongoos, { Schema } from "mongoose";

const reactionSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: ["Video", "Comment"],
      required: true,
    },
    type: {
      type: number,
      enum: [1, -1],
      required: true,
    },
  },
  { timestamps: true }
);

reactionSchema.methods.applyReaction = async function (newType) {
  if (![1, -1].includes(newType)) {
    throw new Error("Invalid reaction type. Must be 1 (like) or -1 (dislike).");
  }
  try {
    const Model = mongoose.model(this.targetType);

    if (newType === this.type) {
      // User is toggling the same reaction off
      await Model.updateOne(
        { _id: this.targetId },
        {
          $inc: {
            [newType === 1 ? "likesCount" : "dislikesCount"]: -1,
          },
        }
      );

      await this.remove();
    } else {
      // 🔁 User is switching reaction
      const updates = {
        [this.type === 1 ? "likesCount" : "dislikesCount"]: -1,
        [newType === 1 ? "likesCount" : "dislikesCount"]: 1,
      };
      await Model.updateOne({ _id: this.targetId }, { $inc: updates });

      this.type = newType;
      await this.save();
    }
  } catch (error) {
    throw new Error(`Failed to apply reaction: ${error.message}`);
  }
};

export default mongoose.model("Reaction", reactionSchema);
