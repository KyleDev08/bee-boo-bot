import { Events, GuildMember } from "discord.js";
import { assignRoles } from "../functions/assignsRoles.js";

export default {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member: GuildMember) {
    if (!member.pending) {
      await assignRoles(member);
    }
  },
};
