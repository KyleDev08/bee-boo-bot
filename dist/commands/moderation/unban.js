import { SlashCommandBuilder, InteractionContextType, MessageFlags as ctxResponseFlags, ApplicationCommandType, ContextMenuCommandBuilder, } from "discord.js";
import { isChatInputCommand, isMessage, isUserContextMenuCommand, } from "../../functions/verifycommands.js";
async function executedUnban(ctx, args) {
    if (isMessage(ctx)) {
        const userId = args[0]?.replace(/[<@!>]/g, "");
        if (!userId) {
            return ctx.reply({
                content: "Debes dar su ID.",
            });
        }
        const botMember = await ctx.guild?.members.fetchMe();
        if (!botMember?.permissions.has("BanMembers")) {
            return ctx.reply({
                content: "No tengo permisos para desbanear miembros.",
            });
        }
        if (userId === ctx.author.id) {
            return ctx.reply({
                content: "No puedes desbanearte a ti mismo.",
            });
        }
        if (userId === ctx.client.user?.id) {
            return ctx.reply({
                content: "No puedo desbanearme a mí mismo.",
            });
        }
        const userBan = await ctx.guild?.bans.fetch(userId).catch(() => null);
        if (!userBan) {
            return ctx.reply({
                content: "El usuario no está baneado o no se ha encontrado.",
            });
        }
        ctx.guild?.bans
            .remove(userId, "Desbaneado por comando")
            .then(() => {
            return ctx.reply({
                content: `Usuario con ID ${userId} ha sido desbaneado.`,
            });
        })
            .catch((error) => {
            console.error("Error al desbanear al usuario:", error);
            return ctx.reply({
                content: "Ocurrió un error al intentar desbanear al usuario.",
            });
        });
    }
    if (isChatInputCommand(ctx) || isUserContextMenuCommand(ctx)) {
        const userId = (isChatInputCommand(ctx) && ctx.options.getString("userid")) ||
            (isUserContextMenuCommand(ctx) && ctx.targetId);
        if (!userId) {
            return await ctx.reply({
                content: "No se ha encontrado al usuario.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        const botMember = await ctx.guild?.members.fetchMe();
        if (!botMember?.permissions.has("BanMembers")) {
            return await ctx.reply({
                content: "No tengo permisos para desbanear miembros.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        if (userId === ctx.user.id) {
            return await ctx.reply({
                content: "No puedes desbanearte a ti mismo.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        if (userId === ctx.client.user?.id) {
            return await ctx.reply({
                content: "No puedo desbanearme a mí mismo.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        if (ctx.guild?.ownerId === userId) {
            return await ctx.reply({
                content: "No puedes desbanear al dueño del servidor.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        const banList = await ctx.guild?.bans.fetch();
        const isBanned = banList?.has(userId);
        if (!isBanned) {
            return await ctx.reply({
                content: "El usuario no está baneado.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        ctx.guild?.bans
            .remove(userId, "Desbaneado por comando")
            .then(() => {
            return ctx.reply({
                content: `Usuario <@${userId}> ha sido desbaneado.`,
                flags: ctxResponseFlags.Ephemeral,
            });
        })
            .catch((error) => {
            console.error("Error al desbanear al usuario:", error);
            return ctx.reply({
                content: "Ocurrió un error al intentar desbanear al usuario.",
                flags: ctxResponseFlags.Ephemeral,
            });
        });
    }
}
export default [
    {
        data: new SlashCommandBuilder()
            .setName("unban")
            .setDescription("Unban a user from the server")
            .addStringOption((option) => option
            .setName("userid")
            .setDescription("The ID of the user to unban")
            .setRequired(true))
            .setDefaultMemberPermissions(4)
            .setContexts(InteractionContextType.Guild),
        type: "slash",
        execute: executedUnban,
    },
    {
        data: new ContextMenuCommandBuilder()
            .setName("Unban")
            .setType(ApplicationCommandType.User)
            .setDefaultMemberPermissions(4)
            .setContexts(InteractionContextType.Guild),
        type: "context",
        execute: executedUnban,
    },
    {
        data: {
            name: "unban",
            description: "Unban a user from the server.",
            defaultMemberPermissions: 4,
            context: "GUILD_ONLY",
        },
        type: "prefix",
        execute: executedUnban,
    },
];
