import mongoose from "mongoose"

const shortnerSchema = new mongoose.Schema({
  shortCode: String,
  originalUrl: String,
  clicks: { type: Number, default: 0 },
  createdAt: { type: Number, default: Date.now },
})

export default mongoose.model("Shortner", shortnerSchema)
