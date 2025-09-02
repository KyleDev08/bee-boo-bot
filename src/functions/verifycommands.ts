import {
  ChatInputCommandInteraction,
  Message,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { CommandContext } from "../types/commands.js";
export function isMessage(ctx: CommandContext): ctx is Message {
  return ctx instanceof Message;
}

export function isChatInputCommand(
  ctx: CommandContext
): ctx is ChatInputCommandInteraction {
  return ctx instanceof ChatInputCommandInteraction;
}

export function isUserContextMenuCommand(
  ctx: CommandContext
): ctx is UserContextMenuCommandInteraction {
  return ctx instanceof UserContextMenuCommandInteraction;
}
