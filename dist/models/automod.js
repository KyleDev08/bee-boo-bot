import { model, Schema } from "mongoose";
export default model("automod", new Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
}));
