import prefixModel from "../models/prefix.js";

export async function getPrefix(guildId?: string) {
  if (!guildId) return process.env.PREFIX;

  const findPrefix = await prefixModel.findOne({ guildId });
  return findPrefix ? findPrefix.prefix : process.env.PREFIX;
}
