export async function safeDM(user, payload, interaction) {
    try {
        await user.send(payload);
        return true;
    }
    catch (err) {
        console.error(`❌ No pude enviar DM a ${user.tag}`, err);
        if (interaction) {
            await interaction.followUp({
                content: payload.content ?? "⚠️ No pude enviarte DM.",
                flags: ["Ephemeral"],
            });
        }
        return false;
    }
}
