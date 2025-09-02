import { ActivityType, Events } from "discord.js";
import { deploy } from "../loaders/deploy.js";
import { connect } from "mongoose";
const db_user = process.env.MONGO_USER;
const db_password = process.env.MONGO_PASSWORD;
export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        client.user.setPresence({
            activities: [{ name: "with Discord.js", type: ActivityType.Playing }],
            status: "online",
        });
        console.log(`\x1b[32m${new Date().toLocaleString()} - ${client.user.tag} is ready!`);
        connect(`mongodb+srv://${db_user}:${db_password}@dcbot.rxns84m.mongodb.net/?retryWrites=true&w=majority&appName=dcbot`, {
            dbName: "dcbot",
        })
            .then((server) => {
            console.log(`\x1b[32m${new Date().toLocaleString()} - Connected to the database: ${server.connection.name} in the cluster: ${server.connection.host} in the port: ${server.connection.port}\x1b[0m`);
        })
            .catch((err) => {
            console.log(`\x1b[31m${new Date().toLocaleString()} - Error connecting to the database: ${err}\x1b[0m`);
        });
        await deploy();
    },
};
