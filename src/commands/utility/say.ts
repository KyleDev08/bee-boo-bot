import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildBasedChannel,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say something.")
    .addSubcommand((subc) =>
      subc
        .setName("text")
        .setDescription("Make the bot say something in text.")
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription("The message to say.")
            .setRequired(true)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("embed")
        .setDescription("Make the bot say something in an embed.")
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("The description (use \\n for new lines).")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("title").setDescription("The message to say.")
        )
        .addStringOption((opt) =>
          opt
            .setName("color")
            .setDescription(
              "The color of the embed in hex format (e.g. #ff0000)."
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("image")
            .setDescription("The image to display in the embed.")
        )
    ),
  type: "slash",
  async execute(interaction: ChatInputCommandInteraction) {
    const missingPermissions = await checkBotPermissionsInChannel(
      interaction.channel as GuildBasedChannel
    );
    if (missingPermissions.length > 0) {
      return interaction.reply({
        content: `I am missing the following permissions to execute this command: ${missingPermissions
          .map((p) => `\`${p}\``)
          .join(", ")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.options.getSubcommand() === "text") {
      const message = interaction.options.getString("message", true);
      const channel = interaction.channel as TextChannel;

      await interaction.reply({
        content: "Message sent!",
        flags: MessageFlags.Ephemeral,
      });
      await channel.send({ content: message });
    }

    if (interaction.options.getSubcommand() === "embed") {
      const title = interaction.options.getString("title") ?? null;
      const description = interaction.options
        .getString("description")
        ?.replace(/\\n/g, "\n") as string;
      const color = interaction.options.getString("color") ?? "#2f3136";
      const image = interaction.options.getString("image") ?? null;

      const channel = interaction.channel as TextChannel;

      const isColorValid = /^#([0-9A-F]{3}){1,2}$/i.test(color);
      if (!isColorValid) {
        return interaction.reply({
          content: "The color provided is not a valid hex color.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const isLinkValid = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      if (image && !isLinkValid(image)) {
        return interaction.reply({
          content: "The image provided is not a valid URL.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setColor(color as any);

      if (title) embed.setTitle(title);
      if (image) embed.setImage(image);

      await interaction.reply({
        content: "✅ Embed sent!",
        flags: MessageFlags.Ephemeral,
      });

      await channel.send({ embeds: [embed] });
    }
  },
};
