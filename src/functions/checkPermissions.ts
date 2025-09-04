import {
  CategoryChannel,
  ChannelType,
  Client,
  Guild,
  GuildBasedChannel,
  NonThreadGuildBasedChannel,
  PermissionsBitField,
} from "discord.js";
import { REQUIRED_PERMISSIONS } from "../types/permissions.js";

export async function checkPermissionsInAllChannels(
  client: Client,
  guildId: string
): Promise<Record<string, string[]>> {
  const guild = await client.guilds.fetch(guildId);
  if (!guild) throw new Error("Guild not found");

  const botMember = await guild.members.fetchMe();
  if (!botMember) throw new Error("Bot member not found");

  const results: Record<string, string[]> = {};

  (await guild.channels.fetch())
    .filter((c): c is NonThreadGuildBasedChannel => c !== null)
    .forEach((channel) => {
      const missing =
        channel.permissionsFor(botMember)?.missing(REQUIRED_PERMISSIONS) ?? [];
      if (missing.length > 0) {
        results[channel.name] = missing;
      }
    });

  return results;
}

export async function checkBotPermissionsInChannel(
  channel: GuildBasedChannel | null
): Promise<string[]> {
  if (!channel) return ["❌ Canal no válido."];

  const botMember = await channel.guild.members.fetchMe().catch(() => null);
  if (!botMember) return ["❌ No se encontró al bot en este servidor."];

  if (!("permissionsFor" in channel))
    return ["⚠️ Este tipo de canal no soporta permisos."];

  const allowedPermissions = REQUIRED_PERMISSIONS.filter((perm) =>
    channel.permissionsFor(botMember)?.has(perm, true)
  );

  const missing =
    channel.permissionsFor(botMember)?.missing(allowedPermissions) || [];

  return missing;
}

export async function checkBotPermissionsInCategory(
  category: CategoryChannel | null
): Promise<string[]> {
  if (!category) {
    return ["❌ No se encontró la categoría o no es válida."];
  }
  const botMember = await category.guild.members.fetchMe().catch(() => null);
  if (!botMember) return ["❌ No se encontró al bot en este servidor."];

  if (!("permissionsFor" in category)) {
    return ["⚠️ Este tipo de canal no soporta permisos."];
  }

  const missing =
    category.permissionsFor(botMember)?.missing(REQUIRED_PERMISSIONS) || [];
  return missing;
}

export async function checkBotPermissionsInGuild(
  guild: Guild | null
): Promise<string[]> {
  const botMember = await guild?.members.fetchMe();
  if (!botMember) return ["Bot no encontrado en este servidor."];

  const missing = botMember.permissions.missing(REQUIRED_PERMISSIONS) || [];

  return missing.map((perm) => perm.toString());
}
