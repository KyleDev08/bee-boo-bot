import { GuildBasedChannel, GuildMember, Message } from "discord.js";
import { economyManager, getGlobalUser } from "../../utils/economy.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";

export default {
  data: {
    name: "work",
    description: "Work to earn some coins.",
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
      message.guild!.id,
      message.author.id
    );
    const now = Date.now();
    const worklimit = 8;
    const cooldown = 3600000;

    if (user.workCooldown && now - user.workCooldown < cooldown) {
      const remaining = (cooldown - (now - user.workCooldown)) / 1000;
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      return message.reply({
        content: `Estás trabajando demasiado. Por favor, espera ${minutes}m ${seconds}s antes de trabajar de nuevo.`,
      });
    }

    if (user.limitWork >= worklimit) {
      user.workCooldown = now;
      user.limitWork = 0;
      await user.save();

      await getGlobalUser(message.member as GuildMember);

      return message.reply({
        content:
          "Has alcanzado tu límite de trabajo. Por favor, espera 1 hora antes de volver a trabajar.",
      });
    }

    const minAmount = 5;
    const maxAmount = 75;
    const amount =
      Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

    user.balance += amount;
    user.limitWork += 1;
    await user.save();

    await getGlobalUser(message.member as GuildMember);

    return message.reply(
      `¡Trabajaste y ganaste $${amount}! Has trabajado ${user.limitWork}/${worklimit} veces.`
    );
  },
};
