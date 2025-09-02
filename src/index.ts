import "dotenv/config";
import "./server.js"
import { Client, GatewayIntentBits } from "discord.js";

export const app = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.DirectMessages,
  ],
});

import { loadCommands } from "./loaders/commands.js";
import { loadEvents } from "./loaders/events.js";

loadCommands().catch(console.error);
loadEvents().catch(console.error);

app.login(process.env.TOKEN);
