import { commands } from "./commands.js";
import { REST, Routes } from "discord.js";

export async function deploy() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("🔄 Refrescando comandos de aplicación...");
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(
      `✅ Comandos registrados: ${Array.isArray(data) ? data.length : 0}`
    );
    if (Array.isArray(data)) {
      data.forEach((cmd) => {
        console.log(`   /${cmd.name} -> ID: ${cmd.id}`);
      });
    }
  } catch (err: unknown) {
    console.error("❌ Error al registrar comandos:");

    const e = err as any;

    if (e.rawError) {
      console.error("Código:", e.rawError.code);
      console.error("Mensaje:", e.rawError.message);
      console.error("Errores:", JSON.stringify(e.rawError.errors, null, 2));
    } else if (e instanceof Error) {
      console.error("Mensaje:", e.message);
    } else {
      console.error(e);
    }
  }
}
