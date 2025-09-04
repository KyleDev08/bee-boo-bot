import {
  ActionRowBuilder,
  AutocompleteInteraction,
  Client,
  EmbedBuilder,
  GuildBasedChannel,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { CommandContext } from "../../types/commands.js";
import {
  isChatInputCommand,
  isMessage,
} from "../../functions/verifycommands.js";
import { checkBotPermissionsInChannel } from "../../functions/checkPermissions.js";
import { getPrefix } from "../../functions/getPrefix.js";

async function buildEmbeds(client: Client, prefix: string) {
  let slashCommands = "";
  let prefixCommands = "";

  for (const [, command] of client.commands) {
    const arr = Array.isArray(command) ? command : [command];
    for (const cmd of arr) {
      if (cmd.type === "slash") {
        slashCommands += `\`/${cmd.data.name}\` - ${
          cmd.data.description || "No description"
        }\n`;
      } else if (cmd.type === "prefix") {
        prefixCommands += `\`${prefix}${cmd.data.name}\` - ${
          cmd.data.description || "No description"
        }\n`;
      }
    }
  }

  const slashEmbed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle("🧩 Slash Commands")
    .setDescription(slashCommands || "No slash commands available.");

  const prefixEmbed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle("⌨️ Prefix Commands")
    .setDescription(prefixCommands || "No prefix commands available.");

  return { slashEmbed, prefixEmbed };
}

async function executeHelp(ctx: CommandContext, args: string[]) {
  const missingPerms = await checkBotPermissionsInChannel(
    ctx.channel as GuildBasedChannel
  );

  const client = ctx.client;
  const prefix = await getPrefix(ctx.guild?.id);
  const { slashEmbed, prefixEmbed } = await buildEmbeds(client, prefix);

  if (isMessage(ctx)) {
    if (missingPerms.length > 0) {
      return ctx.reply({
        content: `I am missing the following permissions in this channel: ${missingPerms.join(
          ", "
        )}`,
      });
    }
    const embed = new EmbedBuilder().setColor("Gold");

    if (args[0]) {
      const cmdName = args[0].toLowerCase();
      const cmd = client.commands.get(cmdName);
      if (!cmd) {
        return ctx.reply({
          content: `No command found with the name \`${cmdName}\`.`,
        });
      }

      embed.setTitle(`Help: ${cmd.data.name}`);
      embed.setDescription(cmd.data.description || "No description provided.");

      return ctx.reply({ embeds: [embed] });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("Choose a command type")
      .addOptions([
        {
          label: "Slash Commands",
          value: "slash",
          description: "View all slash commands",
          emoji: "🧩",
        },
        {
          label: "Prefix Commands",
          value: "prefix",
          description: "View all prefix commands",
          emoji: "⌨️",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const reply = await ctx.reply({
      content: "Select a category to view commands:",
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      time: 60_000,
    });

    collector.on(
      "collect",
      async (interaction: StringSelectMenuInteraction) => {
        if (interaction.customId !== "help_menu") return;

        if (interaction.values[0] === "slash") {
          await interaction.update({ embeds: [slashEmbed], components: [row] });
        } else if (interaction.values[0] === "prefix") {
          await interaction.update({
            embeds: [prefixEmbed],
            components: [row],
          });
        }
      }
    );

    collector.on("end", async () => {
      if (reply.editable) {
        await reply.edit({ components: [] });
      }
    });
  }

  if (isChatInputCommand(ctx)) {
    if (missingPerms.length > 0) {
      return ctx.reply({
        content: `I am missing the following permissions in this channel: ${missingPerms.join(
          ", "
        )}`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const cmdName = ctx.options.getString("command");
    const embed = new EmbedBuilder().setColor("Gold");

    if (cmdName) {
      const cmdArray = client.commands.get(cmdName);

      if (!cmdArray) {
        return ctx.reply({
          content: `No command found with the name \`${cmdName}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const arr = Array.isArray(cmdArray) ? cmdArray : [cmdArray];

      embed.setTitle(`Help: ${cmdName}`);

      for (const c of arr) {
        if (c.type === "slash") {
          embed.addFields({
            name: "🧩 Slash Command",
            value: `\`/${c.data.name}\`\n${
              c.data.description || "No description provided."
            }`,
          });
        } else if (c.type === "prefix") {
          embed.addFields({
            name: "⌨️ Prefix Command",
            value: `\`${prefix}${c.data.name}\`\n${
              c.data.description || "No description provided."
            }`,
          });
        } else if (c.type === "context") {
          embed.addFields({
            name: "📋 Context Menu",
            value: `${c.data.name} (Context Command)`,
          });
        }
      }

      return ctx.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("Choose a command type")
      .addOptions([
        {
          label: "Slash Commands",
          value: "slash",
          description: "View all slash commands",
          emoji: "🧩",
        },
        {
          label: "Prefix Commands",
          value: "prefix",
          description: "View all prefix commands",
          emoji: "⌨️",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const reply = await ctx.reply({
      content: "Select a category to view commands:",
      components: [row],
    });

    const message = await reply.fetch();

    const collector = message.createMessageComponentCollector({
      time: 60_000,
    });

    collector.on(
      "collect",
      async (interaction: StringSelectMenuInteraction) => {
        if (interaction.customId !== "help_menu") return;

        if (interaction.values[0] === "slash") {
          await interaction.update({ embeds: [slashEmbed], components: [row] });
        } else if (interaction.values[0] === "prefix") {
          await interaction.update({
            embeds: [prefixEmbed],
            components: [row],
          });
        }
      }
    );

    collector.on("end", async () => {
      if (message.editable) {
        await reply.edit({ components: [] });
      }
    });
  }
}

async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();

  const names = new Set<string>();

  for (const [, command] of interaction.client.commands) {
    const arr = Array.isArray(command) ? command : [command];
    for (const c of arr) {
      if (c.type === "slash" || c.type === "prefix") {
        names.add(c.data.name);
      }
    }
  }

  const choices = Array.from(names);

  const filtered = choices.filter((c) => c.startsWith(focused));

  await interaction.respond(filtered.map((c) => ({ name: c, value: c })));
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName("help")
      .setDescription("Show the help menu.")
      .addStringOption((opt) =>
        opt
          .setName("command")
          .setDescription("Get help for a specific command.")
          .setAutocomplete(true)
          .setRequired(false)
      ),
    type: "slash",
    execute: executeHelp,
    autocomplete: autocomplete,
  },
  {
    data: {
      name: "help",
      description: "Show the help menu.",
      context: "GUILD_ONLY",
    },
    type: "prefix",
    execute: executeHelp,
  },
];
