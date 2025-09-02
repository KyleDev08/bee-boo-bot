import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { app } from "../index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const eventsPath = path.join(__dirname, "..", "events");
export async function loadEvents() {
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const eventModule = await import(fileUrl);
        const event = eventModule.default;
        if (event.once) {
            app.once(event.name, (...args) => event.execute(...args));
        }
        else {
            app.on(event.name, (...args) => event.execute(...args));
        }
    }
}
