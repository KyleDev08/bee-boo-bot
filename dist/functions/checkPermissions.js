import { REQUIRED_PERMISSIONS } from "../types/permissions.js";
export async function checkPermissionsInAllChannels(client, guildId) {
    const guild = await client.guilds.fetch(guildId);
    if (!guild)
        throw new Error("Guild not found");
    const botMember = await guild.members.fetchMe();
    if (!botMember)
        throw new Error("Bot member not found");
    const results = {};
    (await guild.channels.fetch())
        .filter((c) => c !== null)
        .forEach((channel) => {
        const missing = channel.permissionsFor(botMember)?.missing(REQUIRED_PERMISSIONS) ?? [];
        if (missing.length > 0) {
            results[channel.name] = missing;
        }
    });
    return results;
}
export async function checkBotPermissionsInChannel(channel) {
    if (!channel)
        return ["❌ Canal no válido."];
    const botMember = await channel.guild.members.fetchMe().catch(() => null);
    if (!botMember)
        return ["❌ No se encontró al bot en este servidor."];
    if (!("permissionsFor" in channel)) {
        return ["⚠️ Este tipo de canal no soporta permisos."];
    }
    const missing = channel.permissionsFor(botMember)?.missing(REQUIRED_PERMISSIONS) || [];
    return missing;
}
export async function checkBotPermissionsInCategory(category) {
    if (!category) {
        return ["❌ No se encontró la categoría o no es válida."];
    }
    const botMember = await category.guild.members.fetchMe().catch(() => null);
    if (!botMember)
        return ["❌ No se encontró al bot en este servidor."];
    if (!("permissionsFor" in category)) {
        return ["⚠️ Este tipo de canal no soporta permisos."];
    }
    const missing = category.permissionsFor(botMember)?.missing(REQUIRED_PERMISSIONS) || [];
    return missing;
}
export async function checkBotPermissionsInGuild(guild) {
    const botMember = await guild?.members.fetchMe();
    if (!botMember)
        return ["Bot no encontrado en este servidor."];
    const missing = botMember.permissions.missing(REQUIRED_PERMISSIONS) || [];
    return missing.map((perm) => perm.toString());
}
