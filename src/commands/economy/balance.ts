import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildBasedChannel,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  User,
} from "discord.js";
import economyManager, { getGlobalUser } from "../../utils/economy.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to check the balance of")
        .setRequired(false)
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction: ChatInputCommandInteraction) {
    const missingPermissions = await checkBotPermissionsInChannel(
      interaction.channel as GuildBasedChannel
    );

    if (missingPermissions.length > 0) {
      return interaction.reply({
        content: `No tengo los permisos necesarios para ejecutar este comando. Me faltan los siguientes permisos: ${missingPermissions
          .map((p) => `\`${p}\``)
          .join(", ")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const targetUser: User =
      interaction.options.getUser("user") || interaction.user;

    if (targetUser.bot) {
      return interaction.reply({
        content: "Los bots no tienen una economía.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const serverBalance = await economyManager.getServerUser(
      interaction.guild!.id,
      targetUser.id
    );
    const globalBalance = await getGlobalUser(
      await interaction.guild!.members.fetch(targetUser.id)!
    );

    const balanceEmbed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`💰 Balance de ${targetUser.username}`)
      .addFields(
        {
          name: "Balance del Servidor",
          value: `$${serverBalance.balance}`,
          inline: true,
        },
        {
          name: "Banco del Servidor",
          value: `$${serverBalance.bank}`,
          inline: true,
        },
        {
          name: "Balance Global",
          value: `$${globalBalance.balance}`,
          inline: true,
        },
        {
          name: "Banco Global",
          value: `$${globalBalance.bank}`,
          inline: true,
        }
      )
      .setThumbnail(
        "https://media.discordapp.net/attachments/797507077873336382/1412888155106840648/file_00000000098461f8bea94de4454fc606.png?ex=68b9ee22&is=68b89ca2&hm=9337a44486c4bc28b75c429f29250a7110b26d4c0a16624e0078a3421cf26115&=&format=webp&quality=lossless&width=856&height=856"
      )
      .setFooter({
        text: `Datos de la economía`,
      });

    return interaction.reply({ embeds: [balanceEmbed] });
  },
};
