import { model, Schema } from "mongoose";
import { Automod } from "../interface/automod.js";

export default model(
  "automod",
  new Schema<Automod>({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
  })
);
