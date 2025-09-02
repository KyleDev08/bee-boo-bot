import { Message, TextBasedChannel, TextChannel } from "discord.js";
import { FetchMessagesOptions } from "../types/fetch.js";

export async function fetchMessages(
  channel: TextBasedChannel | null,
  options: Partial<FetchMessagesOptions> = {}
) {
  if (!(channel instanceof TextChannel))
    throw new Error("El canal no es un canal de texto.");

  const { reverseArray, userOnly, botOnly, pinnedOnly } = options;

  let messages: Message[] = [];
  let lastId: string | undefined;

  while (true) {
    const fetchedMsg = await channel.messages.fetch({
      limit: 100,
      ...(lastId && { before: lastId }),
    });

    if (fetchedMsg.size === 0) {
      if (reverseArray) messages = messages.reverse();
      if (userOnly) messages = messages.filter((m) => !m.author.bot);
      if (botOnly) messages = messages.filter((m) => m.author.bot);
      if (pinnedOnly) messages = messages.filter((m) => m.pinned);

      return messages;
    }

    messages = messages.concat(Array.from(fetchedMsg.values()));
    lastId = fetchedMsg.lastKey();
  }
}
