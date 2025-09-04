import {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags as ctxResponseFlags,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  GuildMember,
  GuildBasedChannel,
} from "discord.js";
import { CommandContext } from "../../types/commands.js";
import {
  isChatInputCommand,
  isMessage,
  isUserContextMenuCommand,
} from "../../functions/verifycommands.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";

async function executedKick(ctx: CommandContext, args: string[]) {
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
    const missingPermissions = await checkBotPermissionsInChannel(
      ctx.channel as GuildBasedChannel
    );
    if (missingPermissions.length > 0) {
      await ctx.reply({
        content: `No tengo los permisos necesarios para ejecutar este comando. Me faltan los siguientes permisos: ${missingPermissions
          .map((p) => `\`${p}\``)
          .join(", ")}`,
      });
      return;
    }

    const botMember = await ctx.guild?.members.fetchMe();
    if (!botMember?.permissions.has("KickMembers")) {
      return await ctx.reply({
        content: "No tengo permisos para expulsar miembros.",
      });
    }
    if (user.id === ctx.author.id) {
      return await ctx.reply({
        content: "No puedes expulsarte a ti mismo.",
      });
    }
    if (user.id === ctx.client.user?.id) {
      return await ctx.reply({
        content: "No puedo expulsarme a mí mismo.",
      });
    }

    if (user.id === ctx.guild?.ownerId) {
      return await ctx.reply({
        content: "No puedes expulsar al dueño del servidor.",
      });
    }

    let member: GuildMember | null = null;
    try {
      member = (await ctx.guild?.members.fetch(user.id)) ?? null;
    } catch {
      member = null;
    }
    if (!member) {
      return await ctx.reply({
        content: "El usuario no está en el servidor.",
      });
    }
    if (member.roles.highest.position >= botMember.roles.highest.position) {
      return await ctx.reply({
        content:
          "No puedo expulsar a este usuario porque tiene un rol igual o superior al mío.",
      });
    }
    const reason = args.slice(1).join(" ") || "No especificada";

    member.kick(reason).then(() => {
      ctx.reply({
        content: `Expulsado ${user.tag} del servidor.\nRazón: ${reason}`,
      });
    });
  }

  if (isChatInputCommand(ctx) || isUserContextMenuCommand(ctx)) {
    const missingPermissions = await checkBotPermissionsInChannel(
      ctx.channel as GuildBasedChannel
    );

    if (missingPermissions.length > 0) {
      await ctx.reply({
        content: `No tengo los permisos necesarios para ejecutar este comando. Me faltan los siguientes permisos: ${missingPermissions
          .map((p) => `\`${p}\``)
          .join(", ")}`,
        flags: ctxResponseFlags.Ephemeral,
      });
      return;
    }

    const user = ctx.options.getUser("user");
    if (!user) {
      return await ctx.reply({
        content: "no se ha encontrado al usuario.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    const botMember = await ctx.guild?.members.fetchMe();
    if (!botMember?.permissions.has("KickMembers")) {
      return await ctx.reply({
        content: "No tengo permisos para expulsar miembros.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }
    if (user.id === ctx.user.id) {
      return await ctx.reply({
        content: "No puedes expulsarte a ti mismo.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    if (user.id === ctx.client.user?.id) {
      return await ctx.reply({
        content: "No puedo expulsarme a mí mismo.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    if (ctx.guild?.ownerId === user.id) {
      return await ctx.reply({
        content: "No puedes expulsar al dueño del servidor.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    let member: GuildMember | null = null;
    try {
      member = (await ctx.guild?.members.fetch(user.id)) ?? null;
    } catch {
      member = null;
    }

    if (!member) {
      if (ctx.replied || ctx.deferred) {
        await ctx.followUp({
          content: "El usuario no está en el servidor.",
          flags: ctxResponseFlags.Ephemeral,
        });
      } else {
        await ctx.reply({
          content: "El usuario no está en el servidor.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }
      return;
    }

    if (member.roles.highest.position >= botMember.roles.highest.position) {
      return await ctx.reply({
        content:
          "No puedo expulsar a este usuario porque tiene un rol igual o superior al mío.",
        flags: ctxResponseFlags.Ephemeral,
      });
    }

    const reason = ctx.isContextMenuCommand()
      ? "No especificada"
      : ctx.options.getString("reason") || "No especificada";

    member.kick(reason).catch((error) => {
      console.error("Error al banear al usuario:", error);
      return ctx.reply("Ocurrió un error al intentar banear al usuario.");
    });

    await ctx.reply({
      content: `${user.tag} ha sido expulsado del servidor.`,
      flags: ctxResponseFlags.Ephemeral,
    });
  }
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Expulsa a un usuario del servidor.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Usuario a expulsar")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Razón de la expulsión")
          .setRequired(false)
      )
      .setDefaultMemberPermissions(2)
      .setContexts(InteractionContextType.Guild),
    type: "slash",
    execute: executedKick,
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName("Kick")
      .setType(ApplicationCommandType.User)
      .setDefaultMemberPermissions(2)
      .setContexts(InteractionContextType.Guild),
    type: "context",
    execute: executedKick,
  },
  {
    data: {
      name: "kick",
      description: "Expulsa a un usuario del servidor.",
      defaultMemberPermissions: 2,
      context: "GUILD_ONLY",
    },
    type: "prefix",
    execute: executedKick,
  },
];
