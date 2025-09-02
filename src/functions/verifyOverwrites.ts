import {
  ChatInputCommandInteraction,
  MessageFlags,
  TextChannel,
} from "discord.js";

export async function addOverwriteCheck(
  channel: TextChannel,
  interaction: ChatInputCommandInteraction,
  userId?: string,
  roleId?: string
) {
  const overwrites = channel.permissionOverwrites;
  const overwriteUser = overwrites.cache.get(userId ?? "");
  const overwriteRole = overwrites.cache.get(roleId ?? "");

  let msg = "";

  if (overwriteRole && overwriteUser) {
    msg = `El usuario <@${userId}> y el rol <@&${roleId}> ya tienen permisos en este canal.`;
  } else if (overwriteRole) {
    msg = `El rol <@&${roleId}> ya tiene permisos en este canal.`;
  } else if (overwriteUser) {
    msg = `El usuario <@${userId}> ya tiene permisos en este canal.`;
  }

  if (msg) {
    await interaction.reply({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  return false;
}

export async function removeOverwriteCheck(
  channel: TextChannel,
  interaction: ChatInputCommandInteraction,
  userId?: string,
  roleId?: string
) {
  const overwrites = channel.permissionOverwrites;
  const overwriteUser = overwrites.cache.get(userId ?? "");
  const overwriteRole = overwrites.cache.get(roleId ?? "");

  let msg = "";

  if (!overwriteRole && !overwriteUser) {
    msg = `El usuario <@${userId}> y el rol <@&${roleId}> no tienen permisos en este canal.`;
  } else if (!overwriteRole) {
    msg = `El rol <@&${roleId}> no tiene permisos en este canal.`;
  } else if (!overwriteUser) {
    msg = `El usuario <@${userId}> no tiene permisos en este canal.`;
  }

  if (msg) {
    await interaction.reply({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  return false;
}
