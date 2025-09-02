import { SlashCommandBuilder } from "discord.js";
export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!")
        .setDefaultMemberPermissions(0),
    type: "slash",
    async execute(interaction) {
        return await interaction.reply("Pong!");
    },
};
