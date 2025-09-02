import { model, Schema } from "mongoose";
import { Prefix } from "../interface/prefix.js";

export default model(
  "prefix",
  new Schema<Prefix>({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
  })
);
