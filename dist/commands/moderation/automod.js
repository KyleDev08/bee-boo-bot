import { SlashCommandBuilder, MessageFlags as ctxResponseFlags, InteractionContextType, } from "discord.js";
import { autoLogs } from "../../functions/automodSetUp.js";
import automodModel from "../../models/automod.js";
export default {
    data: new SlashCommandBuilder()
        .setName("automod")
        .setDescription("System to automatically moderate the server")
        .addSubcommand((subC) => subC
        .setName("create-rule")
        .setDescription("Check the status of the automod system")
        .addStringOption((opt) => opt
        .setName("word")
        .setDescription("The rule to create")
        .setRequired(true))
        .addStringOption((opt) => opt
        .setName("action")
        .setDescription("The action to take when the rule is violated")
        .setRequired(true)
        .addChoices({ name: "bloquear mensaje", value: "block" }, { name: "enviar alerta", value: "alert" }, { name: "timeout de 10 minuto", value: "timeout" }, { name: "Bloqu. + Alerta", value: "block_alert" }, { name: "Alerta + Timeout", value: "alert_timeout" }, { name: "Las 3 acciones", value: "all" })))
        .addSubcommand((subC) => subC
        .setName("list-rules")
        .setDescription("Check the status of the automod system"))
        .addSubcommand((subC) => subC
        .setName("remove-rule")
        .setDescription("Check the status of the automod system")
        .addStringOption((opt) => opt
        .setName("rule")
        .setDescription("The rule to remove")
        .setRequired(true)))
        .addSubcommand((subC) => subC
        .setName("setup")
        .setDescription("setup the channel for automod logs")
        .addChannelOption((opt) => opt
        .setName("channel")
        .setDescription("The channel to set")
        .setRequired(true)
        .addChannelTypes(0, 5)))
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(1099511627776),
    type: "slash",
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "setup") {
            const channel = interaction.options.getChannel("channel", true);
            const findChannel = await automodModel.findOne({
                guildId: interaction.guild?.id,
            });
            if (findChannel) {
                await automodModel.findOneAndUpdate({ guildId: interaction.guild?.id }, { channelId: channel.id });
                return interaction.reply({
                    content: `Automod log channel updated to ${channel}.`,
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
            else {
                await new automodModel({
                    guildId: interaction.guild?.id,
                    channelId: channel.id,
                }).save();
                return interaction.reply({
                    content: `Automod log channel set to ${channel}.`,
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
        }
        const logChannel = await automodModel.findOne({
            guildId: interaction.guild?.id,
        });
        if (!logChannel) {
            return interaction.reply({
                content: "Automod log channel is not set up. Please set it up using /automod setup.",
                flags: ctxResponseFlags.Ephemeral,
            });
        }
        if (interaction.options.getSubcommand() === "create-rule") {
            const palabra = interaction.options.getString("word", true);
            const action = interaction.options.getString("action", true);
            try {
                const rule = await interaction.guild?.autoModerationRules.create({
                    name: `Rule for ${palabra}`,
                    enabled: true,
                    eventType: 1,
                    triggerType: 1,
                    triggerMetadata: {
                        keywordFilter: [palabra],
                    },
                    actions: [...autoLogs(action, logChannel?.channelId)],
                });
                await interaction.reply({
                    content: `Rule created successfully with ID: ${rule?.id}`,
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
            catch (error) {
                console.error("Error creating automod rule:", error);
                await interaction.reply({
                    content: "There was an error creating the rule.",
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
        }
        if (interaction.options.getSubcommand() === "list-rules") {
            try {
                const rules = await interaction.guild?.autoModerationRules.fetch();
                if (rules && rules.size > 0) {
                    const ruleList = rules
                        .map((rule) => `- ${rule.name} (ID: ${rule.id})`)
                        .join("\n");
                    await interaction.reply({
                        content: `Current Automod Rules:\n${ruleList}`,
                        flags: ctxResponseFlags.Ephemeral,
                    });
                }
                else {
                    await interaction.reply({
                        content: "No automod rules found.",
                        flags: ctxResponseFlags.Ephemeral,
                    });
                }
            }
            catch (error) {
                console.error("Error fetching automod rules:", error);
                await interaction.reply({
                    content: "There was an error fetching the rules.",
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
        }
        if (interaction.options.getSubcommand() === "remove-rule") {
            const ruleId = interaction.options.getString("rule", true);
            // validate rule ID format
            if (!/^\d{17,19}$/.test(ruleId)) {
                await interaction.reply({
                    content: "Invalid rule ID format.",
                    flags: ctxResponseFlags.Ephemeral,
                });
                return;
            }
            try {
                await interaction.guild?.autoModerationRules.delete(ruleId);
                await interaction.reply({
                    content: `Rule with ID: ${ruleId} has been removed.`,
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
            catch (error) {
                console.error("Error deleting automod rule:", error);
                await interaction.reply({
                    content: "There was an error deleting the rule.",
                    flags: ctxResponseFlags.Ephemeral,
                });
            }
        }
    },
};
