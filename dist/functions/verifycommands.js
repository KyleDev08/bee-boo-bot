import { ChatInputCommandInteraction, Message, UserContextMenuCommandInteraction, } from "discord.js";
export function isMessage(ctx) {
    return ctx instanceof Message;
}
export function isChatInputCommand(ctx) {
    return ctx instanceof ChatInputCommandInteraction;
}
export function isUserContextMenuCommand(ctx) {
    return ctx instanceof UserContextMenuCommandInteraction;
}
