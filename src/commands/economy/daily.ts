import { GuildBasedChannel, Message } from "discord.js";
import { economyManager } from "../../utils/economy.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";

export default {
  data: {
    name: "daily",
    description: "Claim your daily reward.",
    context: "GUILD_ONLY",
  },
  type: "prefix",
  async execute(message: Message, args: string[]) {
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
    const user = await economyManager.getServerUser(
      message.guildId!,
      message.author.id
    );
    const now = Date.now();

    if (user.dailyCooldown && now - user.dailyCooldown < 86400000) {
      return message.reply(
        "You have already claimed your daily reward. Please try again later."
      );
    }

    const amout = Math.floor(Math.random() * 401) + 100;
    user.balance += amout;
    user.dailyCooldown = now;
    await user.save();

    return message.reply(
      `You have claimed your daily reward of ${amout} coins!`
    );
  },
};
