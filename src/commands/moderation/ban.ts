import {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags as ctxResponseFlags,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
} from "discord.js";
import { CommandContext } from "../../types/commands.js";
import {
  isChatInputCommand,
  isMessage,
  isUserContextMenuCommand,
} from "../../functions/verifycommands.js";

async function executedBan(ctx: CommandContext, args: string[]) {
  if (isMessage(ctx)) {
    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) {
      return ctx.reply({
        content: "Debes mencionar al usuario o dar su ID.",
      });
    }
    const user = await ctx.client.users.fetch(userId).catch(() => null);
    if (!user) {
      return ctx.reply({
        content: "No se ha encontrado al usuario.",
      });
    }
    const botMember = await ctx.guild?.members.fetchMe();
    if (!botMember?.permissions.has("BanMembers")) {
      return await ctx.reply({
        content: "No tengo permisos para banear miembros.",
      });
    }
    if (user.id === ctx.author.id) {
      return await ctx.reply({
        content: "No puedes banearte a ti mismo.",
      });
    }
    if (user.id === ctx.client.user?.id) {
      return await ctx.reply({
        content: "No puedes banearme.",
      });
    }
    if (user.id === ctx.guild?.ownerId) {
      return await ctx.reply({
        content: "No puedes banear al dueño del servidor.",
      });
    }
    const bansFetch = await ctx.guild?.bans.fetch();
    if (bansFetch?.has(user.id)) {
      return await ctx.reply({
        content: "El usuario ya está baneado.",
      });
    }
    const isMember = await ctx.guild?.members.fetch(user.id).catch(() => null);
    if (!isMember) {
      return await ctx.reply({
        content: "El usuario no está en el servidor.",
      });
    }
    if (isMember.roles.highest.position >= botMember.roles.highest.position) {
      return await ctx.reply({
        content: "No puedo banear a este usuario debido a su rol.",
      });
    }
    const reason = args.slice(1).join(" ") || "No especificada";
    isMember.ban({ reason }).then(() => {
      ctx.reply({
        content: `Baneado ${user.tag} del servidor.\nRazón: ${reason}`,
      });
    });
  }

  if (isChatInputCommand(ctx) || isUserContextMenuCommand(ctx)) {
    const user = ctx.isContextMenuCommand()
      ? ctx.targetUser
      : ctx.options.getUser("user");

    if (!user) {
      return ctx.reply({
        content: "no se ha encontrado al usuario.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    const botMember = await ctx.guild?.members.fetchMe();
    if (!botMember?.permissions.has("BanMembers")) {
      return await ctx.reply({
        content: "No tengo permisos para banear miembros.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    if (user.id === ctx.user.id) {
      return await ctx.reply({
        content: "No puedes banearte a ti mismo.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    if (user.id === ctx.client.user?.id) {
      return await ctx.reply({
        content: "No puedes banearme.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    if (user.id === ctx.guild?.ownerId) {
      return await ctx.reply({
        content: "No puedes banear al dueño del servidor.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    const bansFetch = await ctx.guild?.bans.fetch();

    if (bansFetch?.has(user.id)) {
      return await ctx.reply({
        content: "El usuario ya está baneado.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    const isMember = await ctx.guild?.members.fetch(user.id).catch(() => null);
    if (!isMember) {
      return await ctx.reply({
        content: "El usuario no está en el servidor.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    if (isMember.roles.highest.position >= botMember.roles.highest.position) {
      return await ctx.reply({
        content: "No puedo banear a este usuario debido a su rol.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }
    const reason = ctx.isContextMenuCommand()
      ? "No especificada"
      : ctx.options.getString("reason") || "No especificada";

    isMember.ban({ reason }).then(() => {
      ctx.reply({
        content: `Baneado ${user.tag} del servidor.\nRazón: ${reason}`,
        flags: ctxResponseFlags.Ephemeral,
      });
    });
  }
}

export default [
  {
    data: new SlashCommandBuilder()
      .setDescription("Banea a un usuario del servidor.")
      .setName("ban")
      .setDefaultMemberPermissions(4)
      .setContexts(InteractionContextType.Guild)
      .addUserOption((op) =>
        op.setName("user").setDescription("Usuario a banear").setRequired(true)
      )
      .addStringOption((op) =>
        op
          .setName("reason")
          .setDescription("Razón del baneo")
          .setRequired(false)
      ),
    type: "slash",
    execute: executedBan,
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName("Ban")
      .setType(ApplicationCommandType.User)
      .setDefaultMemberPermissions(4)
      .setContexts(InteractionContextType.Guild),
    type: "context",
    execute: executedBan,
  },
  {
    data: {
      name: "ban",
      description: "Banea a un usuario del servidor.",
      defaultMemberPermissions: 4,
      context: "GUILD_ONLY",
    },
    type: "prefix",
    execute: executedBan,
  },
];
