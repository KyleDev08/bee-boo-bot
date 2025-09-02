import { model, Schema } from "mongoose";
import { AutoRol } from "../interface/autorol.js";

export default model(
  "AutoRol",
  new Schema<AutoRol>({
    guildID: String,
    roles: [String],
  })
);
