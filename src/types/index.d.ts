import type { SlashCommandBuilder } from "discord.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
    prefix: string;
  }
}

declare global {
  declare namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      CLIENT_ID: string;
      PREFIX: string;
      MONGO_USER: string;
      MONGO_PASSWORD: string;
      PORT: number
    }
  }
}
