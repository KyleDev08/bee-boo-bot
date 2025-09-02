import { Role } from "discord.js";
import { Document } from "mongoose";

export interface Ticket extends Document {
  guildId: string;
  userId: string;
  channelId: string;
  reason?: string;
}

export interface guildTickets extends Document {
  guildId: string;
  count: number;
  categoryId: string;
  roles: Role[];
}
