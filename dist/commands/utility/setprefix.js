import { SlashCommandBuilder, InteractionContextType, MessageFlags as ctxResponseFlags, } from "discord.js";
import { isChatInputCommand, isMessage, } from "../../functions/verifycommands.js";
import prefixModel from "../../models/prefix.js";
async function setPrefix(ctx, args) {
    if (isMessage(ctx)) {
        const newPrefix = args[0];
        if (!newPrefix) {
            return ctx.reply({
                content: "Please provide a new prefix.",
            });
        }
        if (newPrefix.length > 3) {
            return ctx.reply({
                content: "Prefix length must be 3 characters or less.",
            });
        }
        const findPrefix = await prefixModel.findOne({
            guildId: ctx.guild?.id,
        });
        if (findPrefix) {
            if (findPrefix.prefix === newPrefix) {
                return ctx.reply({
                    content: `Prefix is already set to \`${newPrefix}\``,
                });
            }
            findPrefix.prefix = newPrefix;
            await findPrefix.save();
        }
        else {
            await new prefixModel({
                guildId: ctx.guild?.id,
                prefix: newPrefix,
            }).save();
        }
        return ctx.reply({
            content: `Prefix set to \`${newPrefix}\``,
        });
    }
    if (isChatInputCommand(ctx)) {
        const newPrefix = ctx.options.getString("prefix", true);
        if (newPrefix.length > 3) {
            return ctx.reply({
                content: "Prefix length must be 3 characters or less.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        const findPrefix = await prefixModel.findOne({
            guildId: ctx.guild?.id,
        });
        if (findPrefix) {
            if (findPrefix.prefix === newPrefix) {
                return ctx.reply({
                    content: `Prefix is already set to \`${newPrefix}\``,
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
            findPrefix.prefix = newPrefix;
            await findPrefix.save();
        }
        else {
            await new prefixModel({
                guildId: ctx.guild?.id,
                prefix: newPrefix,
            }).save();
        }
        return ctx.reply({
            content: `Prefix set to \`${newPrefix}\``,
            flags: ctxResponseFlags.Ephemeral,
        });
    }
}
export default [
    {
        data: new SlashCommandBuilder()
            .setName("setprefix")
            .setDescription("Set the bot prefix for this server")
            .addStringOption((opt) => opt
            .setName("prefix")
            .setDescription("The new prefix to set")
            .setRequired(true))
            .setDefaultMemberPermissions(32)
            .setContexts(InteractionContextType.Guild),
        type: "slash",
        execute: setPrefix,
    },
    {
        data: {
            name: "setprefix",
            description: "Set the bot prefix for this server",
            defaultMemberPermissions: 32,
            context: "GUILD_ONLY",
        },
        type: "prefix",
        execute: setPrefix,
    },
];
