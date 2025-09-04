import { Events, GuildBasedChannel, Message } from "discord.js";
import prefixModel from "../models/prefix.js";
import {
  checkBotPermissionsInChannel,
  checkBotPermissionsInGuild,
} from "../functions/checkPermissions.js";
import { app } from "../index.js";

let prefix: string;

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    if (message.author.bot) return;

    const findPrefix = await prefixModel.findOne({
      guildId: message.guild?.id,
    });
    prefix = findPrefix ? findPrefix.prefix : process.env.PREFIX;

    app.prefix = prefix;

    if (message.mentions.has(message.client.user)) {
      if (!message.guild) return;

      const channelMissing = await checkBotPermissionsInChannel(
        message.channel as GuildBasedChannel
      );

      if (channelMissing.length > 0) {
        try {
          await message.author.send({
            content: `My prefix in the server ${message.guild.name} is \`${prefix}\``,
          });
          return;
        } catch (err) {
          console.error(
            `No pude enviar un mensaje directo a ${message.author.tag}.`
          );
          return;
        }
      }
      return message.reply(`My prefix in this server is \`${prefix}\``);
    }

    if (!message.content.startsWith(prefix!)) return;
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (!command) return;

    const commands = message.client.commands.get(command);
    if (!commands) return;

    const prefixCmd = Array.isArray(commands)
      ? commands.find((c) => c.type === "prefix")
      : commands;

    if (!prefixCmd) return;

    if (prefixCmd.data.context === "GUILD_ONLY") {
      if (!message.guild) {
        return message.reply("This command can only be used in a server.");
      }
    }

    if (prefixCmd.data.defaultMemberPermissions) {
      const member = await message.guild?.members.fetch(message.author.id);
      if (
        !member?.permissions.has(
          BigInt(prefixCmd.data.defaultMemberPermissions)
        )
      ) {
        return message.reply("You don't have permission to use this command.");
      }
    }

    try {
      const missing = await checkBotPermissionsInGuild(message.guild);

      if (missing.length > 0) {
        await message.reply({
          content: `⚠️ No tengo los siguientes permisos necesarios para ejecutar este comando: ${missing.join(
            ", "
          )}`,
        });
        return;
      }
    } catch (error) {
      await message.reply({
        content: `⚠️ Error al verificar permisos: ${(error as Error).message}`,
      });
      return;
    }

    try {
      await prefixCmd.execute(message, args);
    } catch (error) {
      console.error(error);
      await message.reply("There was an error while executing this command!");
    }
  },
};
