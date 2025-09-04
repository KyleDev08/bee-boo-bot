import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { app } from "../index.js";
import { Collection } from "discord.js";

const foldersPath = path.join(__dirname, "..", "commands");
const commandFolders = fs.readdirSync(foldersPath);
export const commands: any[] = [];

console.log(commandFolders);

export async function loadCommands() {
  app.commands = new Collection();

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const fileUrl = pathToFileURL(filePath).href;

      const commandModule = await import(fileUrl);
      const commandOrCommands = commandModule.default;

      console.log(
        "comandos cargados:",
        filePath,
        "->",
        Array.isArray(commandOrCommands)
          ? commandOrCommands.map(
              (c) => c.data.name + " -> Type: " + c.type + " ✅"
            )
          : commandOrCommands.data.name +
              " -> Type: " +
              commandOrCommands.type +
              " ✅"
      );

      if (!Array.isArray(commandOrCommands)) {
        if ("data" in commandOrCommands && "execute" in commandOrCommands) {
          if (!app.commands.has(commandOrCommands.data.name)) {
            app.commands.set(commandOrCommands.data.name, []);
          }
          app.commands.get(commandOrCommands.data.name).push(commandOrCommands);

          if (typeof commandOrCommands.data.toJSON === "function") {
            commands.push(commandOrCommands.data.toJSON());
          }
        }
      } else {
        for (const command of commandOrCommands) {
          if ("data" in command && "execute" in command) {
            if (!app.commands.has(command.data.name)) {
              app.commands.set(command.data.name, []);
            }
            app.commands.get(command.data.name).push(command);

            if (typeof command.data.toJSON === "function") {
              commands.push(command.data.toJSON());
            }
          } else {
            console.error(
              `[WARNING] One of the commands in ${filePath} is missing "data" or "execute".`
            );
          }
        }
      }
    }
  }
}
