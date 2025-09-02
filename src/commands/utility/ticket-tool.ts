import {
  SlashCommandBuilder,
  MessageFlags as ctxResponseFlags,
  ChatInputCommandInteraction,
  InteractionContextType,
  EmbedBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  CategoryChannel,
} from "discord.js";
import { ticket, ticketCounter } from "../../models/ticket.js";
import createTicket from "../../functions/createTicket.js";
import { safeDM } from "../../functions/safeDM.js";
import {
  addOverwriteCheck,
  removeOverwriteCheck,
} from "../../functions/verifyOverwrites.js";
import {
  checkBotPermissionsInCategory,
  checkBotPermissionsInChannel,
} from "../../functions/checkPermissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("System to automatically moderate the server")
    .addSubcommand((subC) =>
      subC
        .setName("setup")
        .setDescription("Check the status of the automod system")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal donde se enviarán los logs")
            .setRequired(false)
            .addChannelTypes(0)
        )
        .addChannelOption((opt) =>
          opt
            .setName("categoria")
            .setDescription("Category where tickets will be created")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addRoleOption((opt) =>
          opt
            .setName("rol")
            .setDescription("Rol con permisos para gestionar los tickets")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("create")
        .setDescription("Create a ticket")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Usuario al que se le abre el ticket")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Razón del ticket")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("close")
        .setDescription("Close a ticket")
        .addStringOption((opt) =>
          opt
            .setName("ticket-id")
            .setDescription("ID del ticket a cerrar")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Reason for closing the ticket")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("add")
        .setDescription("Añadir un rol o usuario a un ticket")
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Rol a añadir al ticket")
            .setRequired(false)
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Usuario a añadir al ticket")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("remove")
        .setDescription("Eliminar un rol o usuario de un ticket")
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Rol a eliminar del ticket")
            .setRequired(false)
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Usuario a eliminar del ticket")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc.setName("list").setDescription("List all open tickets")
    )
    .setContexts(InteractionContextType.Guild),

  type: "slash",
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "setup") {
      const memberPermissions = interaction.memberPermissions;
      if (!memberPermissions?.has("ManageGuild")) {
        return interaction.reply({
          content: "❌ No tienes permiso para usar este comando.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const channel = interaction.options.getChannel("canal");
      const channelId = channel?.id;

      const category = interaction.options.getChannel(
        "categoria"
      ) as CategoryChannel | null;
      const categoryId = category?.id;

      const roleId = interaction.options.getRole("rol")?.id;
      const role = await interaction.guild?.roles
        .fetch(roleId!)
        .catch(() => null);

      if (categoryId && roleId) {
        const missing = await checkBotPermissionsInCategory(category!);

        if (missing.length > 0) {
          return interaction.reply({
            content: `❌ No tengo los permisos necesarios en el canal ${category} para configurar el sistema de tickets. Permisos faltantes: ${missing.join(
              ", "
            )}`,
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        if (category.type !== ChannelType.GuildCategory) {
          return interaction.reply({
            content: "The category must be a category channel",
            flags: ctxResponseFlags.Ephemeral,
          });
        }
        if (role?.id === interaction.guild?.roles.everyone.id) {
          return interaction.reply({
            content: "The role cannot be @everyone",
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        await ticketCounter.findOneAndUpdate(
          { guildId: interaction.guild?.id },
          {
            $set: {
              categoryId: categoryId,
              roles: [roleId],
              count: 1,
            },
            $setOnInsert: { guildId: interaction.guild?.id },
          },
          { new: true, upsert: true }
        );
      } else if (categoryId) {
        const missing = await checkBotPermissionsInCategory(category!);

        if (missing.length > 0) {
          return interaction.reply({
            content: `❌ No tengo los permisos necesarios en la categoria <#${categoryId}> para configurar el sistema de tickets. Permisos faltantes: ${missing.join(
              ", "
            )}`,
            flags: ctxResponseFlags.Ephemeral,
          });
        }
        if (category.type !== ChannelType.GuildCategory) {
          return interaction.reply({
            content: "The category must be a category channel",
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        await ticketCounter.findOneAndUpdate(
          { guildId: interaction.guild?.id },
          {
            $set: { categoryId: categoryId, count: 1 },
            $setOnInsert: { guildId: interaction.guild?.id },
          },
          { new: true, upsert: true }
        );
      } else if (roleId) {
        if (role?.id === interaction.guild?.roles.everyone.id) {
          return interaction.reply({
            content: "The role cannot be @everyone",
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        await ticketCounter.findOneAndUpdate(
          { guildId: interaction.guild?.id },
          {
            $set: { roles: [roleId], count: 1 },
            $setOnInsert: { guildId: interaction.guild?.id },
          },
          { new: true, upsert: true }
        );
      }

      const channelEmbed = await interaction.guild!.channels.fetch(
        channelId || interaction.channelId
      );

      const missing = await checkBotPermissionsInChannel(channelEmbed);

      if (missing.length > 0) {
        return interaction.reply({
          content: `❌ No tengo los permisos necesarios en el canal ${channelEmbed} para configurar el sistema de tickets. Permisos faltantes: ${missing.join(
            ", "
          )}`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const ticketButton = new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("Create Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🎫");

      const rowTicket = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ticketButton
      );

      const sendEmbed = new EmbedBuilder()
        .setTitle("Ticket System")
        .setDescription(`**React with 🎫 to create a ticket**`)
        .setColor("Random")
        .setFooter({
          text: interaction.guild?.name || interaction.client.user?.username,
          iconURL:
            interaction.guild?.iconURL() ||
            interaction.client.user?.avatarURL() ||
            undefined,
        })
        .setThumbnail(
          interaction.guild?.iconURL() ||
            "https://media.discordapp.net/attachments/797507077873336382/1412094672767029268/file_000000009920622fafea285d131e9ed7.png"
        );

      if (channelEmbed?.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: "The channel must be a text channel",
          ephemeral: true,
        });
      }

      if (channelEmbed.isSendable()) {
        await channelEmbed.send({
          embeds: [sendEmbed],
          components: [rowTicket],
        });
        return interaction.reply({
          content: `Ticket system setup in ${channelEmbed}`,
          flags: ctxResponseFlags.Ephemeral,
        });
      } else {
        if (channelEmbed) {
          return interaction.reply({
            content: "❌ No tengo permiso para enviar *embeds* en ese canal.",
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        return interaction.reply({
          content: "I don't have permission to send messages in that channel",
          flags: ctxResponseFlags.Ephemeral,
        });
      }
    }

    if (interaction.options.getSubcommand() === "create") {
      const guild = interaction.guild;

      let user = interaction.user;
      const reason = interaction.options.getString("reason") || undefined;

      const targetUser = interaction.options.getUser("user");

      const hasPermission =
        interaction.memberPermissions?.has("ManageMessages");

      const guildDoc = await ticketCounter.findOneAndUpdate(
        { guildId: interaction.guild?.id },
        {
          $inc: { count: 1 },
          $setOnInsert: { guildId: interaction.guild?.id },
        },
        { new: true, upsert: true }
      );

      const ticketGuildDoc = await ticket.findOne({
        guildId: guild?.id,
        userId: user.id,
      });
      if (targetUser) {
        if (targetUser.bot) {
          return interaction.reply({
            content: "❌ No puedes abrir un ticket a un bot.",
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        if (targetUser.id === interaction.user.id) {
          user = targetUser;
        } else {
          if (hasPermission) {
            user = targetUser;
          } else {
            return interaction.reply({
              content:
                "❌ No tienes permiso para abrir un ticket a otro usuario.",
              flags: ctxResponseFlags.Ephemeral,
            });
          }
        }
      }

      await interaction.reply({
        content: `🎟️ Hola ${interaction.user}, tu ticket está siendo creado...`,
        flags: ctxResponseFlags.Ephemeral,
      });

      if (ticketGuildDoc) {
        const channel = await guild?.channels.fetch(ticketGuildDoc.channelId);

        if (channel) {
          await safeDM(
            user,
            { content: `Ya tienes un ticket abierto: ${channel}` },
            interaction
          );
          interaction.deleteReply();
          return;
        }
        await createTicket(guild, user, guildDoc, reason);
        return interaction.editReply({
          content: `✅ Tu ticket ha sido creado.`,
        });
      } else {
        await ticket.deleteOne();

        await createTicket(guild, user, guildDoc, reason);
        return interaction.editReply({
          content: `✅ Tu ticket ha sido creado.`,
        });
      }
    }

    if (interaction.options.getSubcommand() === "close") {
      const ticketId = interaction.options.getString("ticket-id");
      const reason =
        interaction.options.getString("reason") || "No reason provided";
      const guildDoc = await ticket.findOne({
        guildId: interaction.guild?.id,
        channelId: ticketId || interaction.channel?.id,
      });

      if (!guildDoc || !guildDoc.userId) {
        await interaction.reply({
          content: "❌ No encontré información del ticket o el usuario.",
          flags: ctxResponseFlags.Ephemeral,
        });
        return;
      }

      if (ticketId) {
        if (guildDoc.channelId !== ticketId) {
          await interaction.reply({
            content: "❌ El ID del ticket no coincide con el canal.",
            flags: ctxResponseFlags.Ephemeral,
          });
          return;
        }
      }

      await ticket.findOneAndDelete({
        guildId: interaction.guild?.id,
        channelId: ticketId || interaction.channel?.id,
      });

      const user = await interaction.client.users.fetch(guildDoc.userId);

      if (user.id === interaction.user.id) {
        await interaction.channel?.delete();
      } else {
        if (ticketId) {
          const channel = await interaction.guild?.channels.fetch(ticketId);
          if (channel) {
            await user
              .send({
                content: `Tu ticket en el servidor **${interaction.guild?.name}** ha sido cerrado por el usuario <@${interaction.user.id}> por el motivo de: ${reason}.`,
              })
              .catch(() => {});
            await channel.delete();
          }
          await interaction.reply({
            content: `✅ El ticket ha sido cerrado correctamente.`,
            flags: ctxResponseFlags.Ephemeral,
          });
        } else {
          await user
            .send({
              content: `Tu ticket en el servidor **${interaction.guild?.name}** ha sido cerrado por el usuario <@${interaction.user.id}> por el motivo de: ${reason}.`,
            })
            .catch(() => {});
          await interaction.channel?.delete();
        }
      }
    }

    if (interaction.options.getSubcommand() === "add") {
      const roleOption = interaction.options.getRole("role");
      const user = interaction.options.getUser("user");

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: "❌ Este comando solo puede usarse en un canal de texto.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const hasPermission =
        interaction.memberPermissions?.has("ManageChannels");
      if (!hasPermission) {
        return interaction.reply({
          content: "❌ No tienes permiso para usar este comando.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const channelDoc = await ticket.findOne({
        guildId: interaction.guild?.id,
        channelId: interaction.channelId,
      });
      if (!channelDoc) {
        return interaction.reply({
          content: "❌ Este comando solo puede usarse en un canal de ticket.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      if (!roleOption && !user) {
        return interaction.reply({
          content: "❌ Debes especificar un rol o usuario a añadir.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const role = await interaction.guild?.roles.fetch(roleOption?.id!);

      await addOverwriteCheck(channel, interaction, user?.id, role?.id).then(
        async (exists) => {
          if (exists) return;
        }
      );

      if (role && user) {
        if (role.tags?.botId) {
          return interaction.reply({
            content: "❌ No puedes añadir un bot al ticket.",
            flags: ctxResponseFlags.Ephemeral,
          });
        }

        await channel.permissionOverwrites.edit(role.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        if (user.bot) {
          return interaction.reply({
            content: "❌ No puedes añadir un bot al ticket.",
            flags: ctxResponseFlags.Ephemeral,
          });
        }
        await channel.permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
        return interaction.reply({
          content: `✅ El rol ${role} y el usuario ${user} han sido añadidos al ticket.`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      if (role) {
        await channel.permissionOverwrites.edit(role.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
        return interaction.reply({
          content: `✅ El rol ${role} ha sido añadido al ticket.`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }
      if (user) {
        if (user.bot) {
          return interaction.reply({
            content: "❌ No puedes añadir un bot al ticket.",
            flags: ctxResponseFlags.Ephemeral,
          });
        }
        await channel.permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
        return interaction.reply({
          content: `✅ El usuario ${user} ha sido añadido al ticket.`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }
    }

    if (interaction.options.getSubcommand() === "remove") {
      const role = interaction.options.getRole("role");
      const user = interaction.options.getUser("user");

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: "❌ Este comando solo puede usarse en un canal de texto.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const hasPermission =
        interaction.memberPermissions?.has("ManageChannels");
      if (!hasPermission) {
        return interaction.reply({
          content: "❌ No tienes permiso para usar este comando.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      const channelDoc = await ticket.findOne({
        guildId: interaction.guild?.id,
        channelId: interaction.channelId,
      });
      if (!channelDoc) {
        return interaction.reply({
          content: "❌ Este comando solo puede usarse en un canal de ticket.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      if (!role && !user) {
        return interaction.reply({
          content: "❌ Debes especificar un rol o usuario a añadir.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      await removeOverwriteCheck(channel, interaction, user?.id, role?.id).then(
        async (exists) => {
          if (exists) return;
        }
      );

      if (role && user) {
        await channel.permissionOverwrites.delete(role.id);

        await channel.permissionOverwrites.delete(user.id);
        return interaction.reply({
          content: `✅ El rol ${role} y el usuario ${user} han sido añadidos al ticket.`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }

      if (role) {
        await channel.permissionOverwrites.delete(role.id);
        return interaction.reply({
          content: `✅ El rol ${role} ha sido añadido al ticket.`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }
      if (user) {
        await channel.permissionOverwrites.delete(user.id);
        return interaction.reply({
          content: `✅ El usuario ${user} ha sido añadido al ticket.`,
          flags: ctxResponseFlags.Ephemeral,
        });
      }
    }

    if (interaction.options.getSubcommand() === "list") {
      const hasPermission =
        interaction.memberPermissions?.has("ManageChannels");
      if (!hasPermission) {
        return interaction.reply({
          content: "❌ No tienes permiso para usar este comando.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }
      const tickets = await ticket.find({
        guildId: interaction.guild?.id,
      });

      if (tickets.length === 0) {
        return interaction.reply({
          content: "❌ No hay tickets abiertos en este servidor.",
          flags: ctxResponseFlags.Ephemeral,
        });
      }
      const embed = new EmbedBuilder()
        .setTitle("Tickets abiertos")
        .setColor("Random")
        .setFooter({
          text: interaction.guild?.name || interaction.client.user?.username,
          iconURL:
            interaction.guild?.iconURL() ||
            interaction.client.user?.avatarURL() ||
            undefined,
        })
        .setThumbnail(
          interaction.guild?.iconURL() ||
            "https://media.discordapp.net/attachments/797507077873336382/1412094672767029268/file_000000009920622fafea285d131e9ed7.png"
        );
      let description = "";
      for (const t of tickets) {
        const user = await interaction.client.users.fetch(t.userId);
        description += `• Ticket de ${user.tag} - <#${t.channelId}>\n`;
      }
      embed.setDescription(description);

      return interaction.reply({
        embeds: [embed],
        flags: ctxResponseFlags.Ephemeral,
      });
    }
  },
};
