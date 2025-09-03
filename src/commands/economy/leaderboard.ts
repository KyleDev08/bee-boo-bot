import {
  Message,
  EmbedBuilder,
  GuildBasedChannel,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from "discord.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";
import { globalEconomy, serverEconomy } from "../../models/economy.js";
import { EconomyGuild, GlobalEconomy } from "../../interface/economy.js";

const LEADERBOARD_TYPES = {
  SERVER: "server",
  GLOBAL: "global",
};

export default {
  data: {
    name: "leaderboard",
    description: "Muestra el top 10 de la economía global o del servidor.",
    context: "GUILD_ONLY",
  },
  type: "prefix",
  async execute(message: Message) {
    const missingPerms = await checkBotPermissionsInChannel(
      message.channel as GuildBasedChannel
    );
    if (missingPerms.length > 0) {
      return message.reply(
        `Me faltan los siguientes permisos en este canal: ${missingPerms
          .map((perm) => `\`${perm}\``)
          .join(", ")}`
      );
    }

    const serverUsers = await serverEconomy
      .find({ guildId: message.guildId })
      .sort({ balance: -1 })
      .limit(10);

    const initialEmbed = createLeaderboardEmbed(
      message.guild!.name,
      "Servidor",
      serverUsers
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("leaderboard_selector")
      .setPlaceholder("Selecciona el tipo de leaderboard...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Leaderboard del Servidor")
          .setValue(LEADERBOARD_TYPES.SERVER)
          .setDescription("Ver el top 10 de este servidor"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Leaderboard Global")
          .setValue(LEADERBOARD_TYPES.GLOBAL)
          .setDescription("Ver el top 10 de todos los servidores")
      );

    const actionRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const reply = await message.reply({
      embeds: [initialEmbed],
      components: [actionRow],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === message.author.id,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      let newEmbed: EmbedBuilder;

      if (i.values[0] === LEADERBOARD_TYPES.SERVER) {
        const users = await serverEconomy
          .find({ guildId: message.guildId! })
          .sort({ balance: -1 })
          .limit(10);
        newEmbed = createLeaderboardEmbed(
          message.guild!.name,
          "Servidor",
          users
        );
      } else {
        const users = await globalEconomy
          .find({})
          .sort({ balance: -1 })
          .limit(10);
        newEmbed = createLeaderboardEmbed("Global", "Global", users);
      }

      await i.editReply({ embeds: [newEmbed] });
    });

    collector.on("end", () => {
      const disabledRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          selectMenu.setDisabled(true)
        );
      reply.edit({ components: [disabledRow] }).catch(console.error);
    });
  },
};

function createLeaderboardEmbed(
  guildName: string,
  type: string,
  users: (EconomyGuild | GlobalEconomy)[]
): EmbedBuilder {
  const description =
    users.length > 0
      ? users
          .map(
            (user, index) =>
              `**${index + 1}.** <@${user.userId}> - **$${user.balance}**`
          )
          .join("\n")
      : "No hay usuarios en este leaderboard todavía.";

  return new EmbedBuilder()
    .setColor("Gold")
    .setTitle(`🏆 Leaderboard ${guildName}`)
    .setDescription(description)
    .setTimestamp()
    .setThumbnail(
      "https://media.discordapp.net/attachments/797507077873336382/1412888155106840648/file_00000000098461f8bea94de4454fc606.png?ex=68b9ee22&is=68b89ca2&hm=9337a44486c4bc28b75c429f29250a7110b26d4c0a16624e0078a3421cf26115&=&format=webp&quality=lossless&width=856&height=856"
    )
    .setFooter({ text: `Tipo: ${type}` });
}
