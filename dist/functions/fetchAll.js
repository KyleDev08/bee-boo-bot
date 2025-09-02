import { TextChannel } from "discord.js";
export async function fetchMessages(channel, options = {}) {
    if (!(channel instanceof TextChannel))
        throw new Error("El canal no es un canal de texto.");
    const { reverseArray, userOnly, botOnly, pinnedOnly } = options;
    let messages = [];
    let lastId;
    while (true) {
        const fetchedMsg = await channel.messages.fetch({
            limit: 100,
            ...(lastId && { before: lastId }),
        });
        if (fetchedMsg.size === 0) {
            if (reverseArray)
                messages = messages.reverse();
            if (userOnly)
                messages = messages.filter((m) => !m.author.bot);
            if (botOnly)
                messages = messages.filter((m) => m.author.bot);
            if (pinnedOnly)
                messages = messages.filter((m) => m.pinned);
            return messages;
        }
        messages = messages.concat(Array.from(fetchedMsg.values()));
        lastId = fetchedMsg.lastKey();
    }
}
