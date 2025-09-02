import { model, Schema } from "mongoose";
import { Ticket, guildTickets } from "../interface/ticket.js";

export const ticket = model(
  "ticket",
  new Schema<Ticket>({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    reason: { type: String, required: false },
  })
);

export const ticketCounter = model(
  "ticketCounter",
  new Schema<guildTickets>({
    guildId: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    categoryId: { type: String, required: false },
    roles: { type: [String], required: false, default: [] },
  })
);
