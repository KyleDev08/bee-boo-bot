import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  GuildMemberRoleManager,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import economyManager, { getGlobalUser } from "../../utils/economy.js";
import { shopGuild } from "../../models/economy.js";
import { shopItem } from "../../interface/economy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addStringOption((opt) =>
      opt
        .setName("item")
        .setDescription("The item you want to buy")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setContexts(InteractionContextType.Guild),
  type: "slash",
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guild!.id;
    const member = interaction.member as GuildMember;
    const userId = member.user.id;

    const shop = await shopGuild.findOne({ guildId });
    if (!shop || shop.items.length === 0) {
      return interaction.reply({
        content: "La tienda está vacía.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const itemName = interaction.options.getString("item", true);
    const item: shopItem | undefined = shop.items.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!item) {
      return interaction.reply({
        content: "Ítem no encontrado en la tienda.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = await economyManager.getServerUser(guildId, userId);
    if (user.balance < item.price) {
      return interaction.reply({
        content: "No tienes suficiente dinero para comprar este ítem.",
        flags: MessageFlags.Ephemeral,
      });
    }

    user.balance -= item.price;
    user.inventory.push({ itemId: item.name, quantity: 1 });
    await user.save();

    await getGlobalUser(member);

    if (item.value) {
      try {
        const memberRoles = member.roles as GuildMemberRoleManager;
        if (memberRoles.cache.has(item.value)) {
          return interaction.reply({
            content: `Ya tienes el rol **${item.name}**.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        await memberRoles.add(item.value);
      } catch (error) {
        console.error("Error al añadir el rol:", error);
        return interaction.reply({
          content:
            "Hubo un error al añadir el rol. Por favor, intenta de nuevo más tarde.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    return interaction.reply({
      content: `Has comprado **${item.name}** por **$${item.price}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const guildId = interaction.guild!.id;
    const focused = interaction.options.getFocused();

    const shop = await shopGuild.findOne({ guildId });
    if (!shop || shop.items.length === 0) {
      return interaction.respond([]);
    }

    const filtered = shop.items
      .filter((i) => i.name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25); // Discord solo permite 25 sugerencias

    return interaction.respond(
      filtered.map((i) => ({
        name: `${i.name} ($${i.price})`,
        value: i.name,
      }))
    );
  },
};
