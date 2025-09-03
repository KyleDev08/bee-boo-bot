import {
  Events,
  MessageFlags,
  type CacheType,
  type Interaction,
} from "discord.js";
import { ticket, ticketCounter } from "../models/ticket.js";
import createTicket from "../functions/createTicket.js";
import { fetchMessages } from "../functions/fetchAll.js";
import { checkBotPermissionsInGuild } from "../functions/checkPermissions.js";

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction<CacheType>) {
    if (interaction.isButton()) {
      if (interaction.customId === "create_ticket") {
        const guild = interaction.guild;
        const user = interaction.user;
        const guildDoc = await ticketCounter.findOneAndUpdate(
          { guildId: interaction.guild?.id },
          {
            $inc: { count: 1 },
            $setOnInsert: { guildId: interaction.guild?.id },
          },
          { new: true, upsert: true }
        );
        await interaction.reply({
          content: `🎟️ Hola ${interaction.user}, tu ticket está siendo creado...`,
          flags: MessageFlags.Ephemeral,
        });
        const ticketGuildDoc = await ticket.findOne({
          guildId: interaction.guild?.id,
          userId: interaction.user.id,
        });

        if (ticketGuildDoc) {
          const channel = await interaction.guild?.channels.fetch(
            ticketGuildDoc.channelId
          );
          if (channel) {
            try {
              await user.send({
                content: `Ya tienes un ticket abierto: ${channel}`,
              });
            } catch {
              await interaction.editReply({
                content: `⚠️ No pude enviarte un mensaje directo.\nYa tienes un ticket abierto: ${channel}`,
              });
            }
          } else {
            await ticket.deleteOne({
              guildId: interaction.guild?.id,
              userId: interaction.user.id,
            });

            await createTicket(guild, user, guildDoc);
            return interaction.editReply({
              content: `✅ Tu ticket ha sido creado.`,
            });
          }
        } else {
          await ticket.deleteOne();
          await createTicket(guild, user, guildDoc);
          return interaction.editReply({
            content: `✅ Tu ticket ha sido creado.`,
          });
        }
      }
      if (interaction.customId === "close_ticket") {
        const userId = await ticket.findOne({
          guildId: interaction.guild?.id,
          channelId: interaction.channel?.id,
        });

        if (!userId || !userId.userId) {
          await interaction.reply({
            content: "❌ No encontré información del ticket o el usuario.",
            ephemeral: true,
          });
          return;
        }

        await ticket.findOneAndDelete({
          guildId: interaction.guild?.id,
          channelId: interaction.channel?.id,
        });

        const user = await interaction.client.users.fetch(userId.userId);

        if (user.id === interaction.user.id) {
          await interaction.channel?.delete();
        } else {
          await user
            .send({
              content: `Tu ticket en el servidor **${interaction.guild?.name}** ha sido cerrado por el usuario <@${interaction.user.id}>.`,
            })
            .catch(() => {});
          await interaction.channel?.delete();
        }
      }
      if (interaction.customId === "transcript_ticket") {
        const channel = interaction.channel;

        interaction.reply({
          content: `⏳ Generando la transcripción...`,
        });

        const msg = await fetchMessages(channel, {
          reverseArray: true,
          userOnly: false,
          botOnly: false,
          pinnedOnly: false,
        });
        if (msg.length === 0) {
          await interaction.reply({
            content: `❌ No hay mensajesen el canal para crear una transcripción.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const transcript = msg.map((message) => {
          let parts: string[] = [];

          if (message.content) {
            parts.push(message.content);
          }

          if (message.stickers.size > 0) {
            const stickers = message.stickers.map(
              (sticker) => `[Sticker: ${sticker.name}] (${sticker.url})`
            );
            parts.push(...stickers);
          }

          if (message.attachments.size > 0) {
            const files = message.attachments.map(
              (file) => `[Archivo: ${file.name}] (${file.url})`
            );
            parts.push(...files);
          }

          if (message.reactions.cache.size > 0) {
            const reactions = message.reactions.cache.map(
              (r) => `${r.emoji.name} x${r.count}`
            );
            parts.push(`[Reacciones: ${reactions.join(", ")}]`);
          }

          if (parts.length === 0) {
            parts.push("[Mensaje vacío / embed]");
          }

          return `${message.author.tag}: ${parts.join(" ")}`;
        });

        const transcriptText = transcript.join("\n");

        const MAX_LENGTH = 1_000_000;
        const safeTranscript =
          transcriptText.length > MAX_LENGTH
            ? transcriptText.slice(0, MAX_LENGTH) +
              "\n\n[TRANSCRIPCIÓN CORTADA]"
            : transcriptText;

        const buffer = Buffer.from(safeTranscript, "utf-8");

        await interaction.editReply({
          content: `✅ Transcripción creada correctamente.`,
          files: [{ attachment: buffer, name: "transcript.txt" }],
        });
      }
    }

    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      try {
        if (command && command.autocomplete) {
          await command.autocomplete(interaction);
        }
      } catch (err) {
        console.error("Error en autocompletado:", err);
      }
      return;
    }

    if (
      !interaction.isChatInputCommand() &&
      !interaction.isUserContextMenuCommand() &&
      !interaction.isMessageContextMenuCommand()
    )
      return;

    try {
      const missing = await checkBotPermissionsInGuild(interaction.guild);

      if (missing.length > 0) {
        await interaction.reply({
          content: `⚠️ No tengo los siguientes permisos necesarios para ejecutar este comando: ${missing.join(
            ", "
          )}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    } catch (error) {
      await interaction.reply({
        content: `⚠️ Error al verificar permisos: ${(error as Error).message}`,
      });
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command?.execute) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
