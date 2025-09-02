import { InteractionContextType, MessageFlags, SlashCommandBuilder, } from "discord.js";
import autorol from "../../models/autorol.js";
export default {
    data: new SlashCommandBuilder()
        .setName("autorol")
        .setDescription("set the role/s to be given to new members")
        .addSubcommand((sub) => sub
        .setName("set")
        .setDescription("Set a role to be given to new members")
        .addRoleOption((opt) => opt
        .setName("role")
        .setDescription("the role to be given to new members")
        .setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove")
        .setDescription("Remove a role from autoroles")
        .addRoleOption((opt) => opt
        .setName("role")
        .setDescription("the role to be removed from autoroles")
        .setRequired(true)))
        .addSubcommand((sub) => sub.setName("list").setDescription("List all autoroles"))
        .setDefaultMemberPermissions(268435456)
        .setContexts(InteractionContextType.Guild),
    type: "slash",
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "set") {
            const roleId = interaction.options.getRole("role")?.id;
            const role = await interaction.guild?.roles.fetch(roleId);
            if (!role) {
                return interaction.reply({
                    content: "Role not found",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const botMember = await interaction.guild?.members.fetchMe();
            if (botMember?.roles.highest.position <= role.position) {
                return interaction.reply({
                    content: "I can't assign that role, please make sure my highest role is above the role you want to set.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const findRole = await autorol.findOne({ guildID: interaction.guildId });
            if (findRole?.roles.includes(role)) {
                return interaction.reply({
                    content: "That role is already an autorole.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (!findRole) {
                await new autorol({
                    guildID: interaction.guildId,
                    roles: [roleId],
                }).save();
                return interaction.reply({
                    content: `Set ${role} as an autorole.`,
                    flags: MessageFlags.Ephemeral,
                });
            }
            else {
                await autorol.findOneAndUpdate({
                    guildID: interaction.guildId,
                }, {
                    roles: [...findRole.roles, roleId],
                }, { new: true });
                const mappedRoles = findRole.roles.map((r) => `<@&${r}>`).join(", ");
                return await interaction.reply({
                    content: `Set ${role} as an autorole.\nCurrent autoroles: ${mappedRoles}, <@&${roleId}>`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        if (interaction.options.getSubcommand() === "remove") {
            const roleId = interaction.options.getRole("role")?.id;
            const role = await interaction.guild?.roles.fetch(roleId);
            if (!role) {
                return interaction.reply({
                    content: "Role not found",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const findRole = await autorol.findOne({ guildID: interaction.guildId });
            if (!findRole) {
                return interaction.reply({
                    content: "No autoroles are set for this server.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (!findRole.roles.includes(role)) {
                return interaction.reply({
                    content: "That role is not an autorole.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const removeDoc = await autorol.findOneAndUpdate({ guildID: interaction.guildId }, { $pull: { roles: roleId } }, { new: true });
            return await interaction.reply({
                content: `Removed ${role} from autoroles. \nCurrent autoroles: ${removeDoc?.roles.length
                    ? removeDoc.roles.map((r) => `<@&${r}>`).join(", ")
                    : "None"}`,
                flags: MessageFlags.Ephemeral,
            });
        }
        if (interaction.options.getSubcommand() === "list") {
            const findRole = await autorol.findOne({ guildID: interaction.guildId });
            if (!findRole || findRole.roles.length === 0) {
                return interaction.reply({
                    content: "No autoroles are set for this server.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const mappedRoles = findRole.roles.map((r) => `<@&${r}>`).join(", ");
            return interaction.reply({
                content: `Current autoroles: ${mappedRoles}`,
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
