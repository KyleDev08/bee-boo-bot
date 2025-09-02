import { Events } from "discord.js";
import { assignRoles } from "../functions/assignsRoles.js";
export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        if (!member.pending) {
            await assignRoles(member);
        }
    },
};
