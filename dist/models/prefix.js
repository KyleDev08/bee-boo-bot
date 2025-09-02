import { model, Schema } from "mongoose";
export default model("prefix", new Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
}));
