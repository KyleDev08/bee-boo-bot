import { Events } from "discord.js";
import prefixModel from "../models/prefix.js";
import { checkBotPermissionsInChannel, checkBotPermissionsInGuild, } from "../functions/checkPermissions.js";
let prefix;
export default {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        if (message.author.bot)
            return;
        const findPrefix = await prefixModel.findOne({
            guildId: message.guild?.id,
        });
        prefix = findPrefix ? findPrefix.prefix : process.env.PREFIX;
        if (message.mentions.has(message.client.user)) {
            if (!message.guild)
                return;
            const channelMissing = await checkBotPermissionsInChannel(message.channel);
            if (channelMissing.length > 0) {
                try {
                    await message.author.send({
                        content: `My prefix in the server ${message.guild.name} is \`${prefix}\``,
                    });
                    return;
                }
                catch (err) {
                    console.error(`No pude enviar un mensaje directo a ${message.author.tag}.`);
                    return;
                }
            }
        }
        if (!message.content.startsWith(prefix))
            return;
        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();
        if (!command)
            return;
        const cmd = message.client.commands.get(command);
        if (!cmd?.execute)
            return;
        if (cmd.data.context === "GUILD_ONLY") {
            if (!message.guild) {
                return message.reply("This command can only be used in a server.");
            }
        }
        if (cmd.data.defaultMemberPermissions) {
            const member = await message.guild?.members.fetch(message.author.id);
            if (!member?.permissions.has(BigInt(cmd.data.defaultMemberPermissions))) {
                return message.reply("You don't have permission to use this command.");
            }
        }
        try {
            const missing = await checkBotPermissionsInGuild(message.guild);
            if (missing.length > 0) {
                await message.reply({
                    content: `⚠️ No tengo los siguientes permisos necesarios para ejecutar este comando: ${missing.join(", ")}`,
                });
                return;
            }
        }
        catch (error) {
            await message.reply({
                content: `⚠️ Error al verificar permisos: ${error.message}`,
            });
            return;
        }
        try {
            await cmd.execute(message, args);
        }
        catch (error) {
            console.error(error);
            await message.reply("There was an error while executing this command!");
        }
    },
};
