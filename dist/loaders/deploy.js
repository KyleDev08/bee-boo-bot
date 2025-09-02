import { commands } from "./commands.js";
import { REST, Routes } from "discord.js";
export async function deploy() {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    try {
        console.log("🔄 Refrescando comandos de aplicación...");
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });
        console.log("✅ Comandos registrados!");
    }
    catch (err) {
        console.error(err);
    }
}
