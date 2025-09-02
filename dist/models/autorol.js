import { model, Schema } from "mongoose";
export default model("AutoRol", new Schema({
    guildID: String,
    roles: [String],
}));
