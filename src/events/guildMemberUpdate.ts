import { Events, GuildMember } from "discord.js";
import { assignRoles } from "../functions/assignsRoles.js";

export default {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    if (oldMember.pending && !newMember.pending) {
      await assignRoles(newMember);
    }
  },
};
