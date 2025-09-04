import { EmbedBuilder, GuildBasedChannel, Message } from "discord.js";
import { shopGuild } from "../../models/economy.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";

export default {
  data: {
    name: "shop",
    description: "View the shop items",
    context: "GUILD_ONLY",
  },
  type: "prefix",
  async execute(message: Message) {
    const missingPermissions = await checkBotPermissionsInChannel(
      message.channel as GuildBasedChannel
    );

    if (missingPermissions.length > 0) {
      await message.reply({
        content: `No tengo los permisos necesarios para ejecutar este comando. Me faltan los siguientes permisos: ${missingPermissions
          .map((p) => `\`${p}\``)
          .join(", ")}`,
      });
      return;
    }

    const shop = await shopGuild.findOne({ guildId: message.guildId! });
    if (!shop || shop.items.length === 0) {
      return message.reply("The shop is currently empty.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Tienda de ${message.guild!.name}`)
      .setColor("Blue")
      .setThumbnail(
        "https://media.discordapp.net/attachments/797507077873336382/1412888155106840648/file_00000000098461f8bea94de4454fc606.png?ex=68b9ee22&is=68b89ca2&hm=9337a44486c4bc28b75c429f29250a7110b26d4c0a16624e0078a3421cf26115&=&format=webp&quality=lossless&width=856&height=856"
      )
      .setTimestamp();

    shop.items.forEach((item, i) => {
      embed.addFields({
        name: `${i + 1}. ${item.name} - $${item.price}`,
        value: `${item.description || "Sin descripción"}${
          item.value ? `\nTipo de Ítem: - Rol <@&${item.value}>` : ""
        }`,
      });
    });

    return message.reply({ embeds: [embed] });
  },
};
