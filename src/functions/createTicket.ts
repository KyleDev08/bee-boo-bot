import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
  OverwriteResolvable,
  User,
} from "discord.js";
import { guildTickets } from "../interface/ticket.js";
import { ticket } from "../models/ticket.js";
import { REQUIRED_PERMISSIONS } from "../types/permissions.js";

export default async function (
  guild: Guild | null,
  user: User,
  guildDoc: guildTickets,
  reason?: string
) {
  const embedWelcome = new EmbedBuilder()
    .setTitle("Welcome to your ticket")
    .setDescription(
      `We will be with you shortly,\n Click the button with 🔒 to close this ticket.\n Click the button with 📰 to receive the messages sent in the ticket.`
    )
    .setColor("Green")
    .setThumbnail(
      "https://media.discordapp.net/attachments/797507077873336382/1412094672767029268/file_000000009920622fafea285d131e9ed7.png"
    )
    .setFooter({
      text: guild?.name || guild?.client.user.username || "Ticket System",
      iconURL: guild?.iconURL() || guild?.client.user.avatarURL() || undefined,
    })
    .setTimestamp();

  const rowTicket = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒"),

    new ButtonBuilder()
      .setCustomId("transcript_ticket")
      .setLabel("Transcript")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📰")
  );

  const me = guild!.members.me;
  if (!me) throw new Error("El bot no está en el servidor");

  const botHighest = me.roles.highest.position;

  const overWrites: OverwriteResolvable[] = [];

  guild!.roles.cache
    .filter((r) => r.position < botHighest && r.id !== guild!.id)
    .forEach((role) => {
      overWrites.push({
        id: role.id,
        deny: ["ViewChannel"],
      });
    });

  overWrites?.push({
    id: user.id,
    allow: ["ViewChannel", "SendMessages"],
  });

  overWrites?.push({
    id: me.id,
    allow: [
      "ViewChannel",
      "SendMessages",
      "ManageChannels",
      "ReadMessageHistory",
    ],
  });

  for (const roleId of guildDoc.roles as unknown as string[]) {
    const role = guild!.roles.cache.get(roleId);
    if (role && role.position < botHighest) {
      overWrites.push({
        id: role.id,
        allow: ["ViewChannel", "SendMessages"],
      });
    }
  }

  const ticketChannel = await guild?.channels.create({
    name: `Ticket-${guildDoc.count}`,
    parent: guildDoc.categoryId || undefined,
    permissionOverwrites: overWrites,
  });

  await ticketChannel?.send({
    content: `Hello ${user}, please describe your issue in detail. A staff member will be with you shortly.`,
    embeds: [embedWelcome],
    components: [rowTicket],
  });

  await new ticket({
    guildId: guild?.id,
    userId: user.id,
    channelId: ticketChannel?.id,
    reason: reason || "No reason provided",
  }).save();
}
