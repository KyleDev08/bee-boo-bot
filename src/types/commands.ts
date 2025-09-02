import {
  Message,
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  Interaction,
} from "discord.js";

export type CommandContext =
  | Message
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction;
