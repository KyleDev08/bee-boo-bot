import autorol from "../models/autorol.js";
export async function assignRoles(member) {
    const autorolFind = await autorol.findOne({ guildID: member.guild.id });
    if (!autorolFind)
        return;
    try {
        for (const mappedRole of autorolFind.roles) {
            await member.roles.add(mappedRole).catch(console.error);
        }
    }
    catch (error) {
        console.error(error);
    }
}
