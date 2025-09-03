import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { shopGuild } from "../../models/economy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Create a shop for your server")
    .addSubcommand((subc) =>
      subc.setName("create").setDescription("Create a shop")
    )
    .addSubcommand((subc) =>
      subc
        .setName("add-item")
        .setDescription("Add an item to the shop")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Name of the item")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("Description of the item")
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("price")
            .setDescription("Price of the item")
            .setRequired(true)
        )
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Rol que se otorga al comprar este ítem")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("update-item")
        .setDescription("Update an item in the shop")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Name of the item to update")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("new-name")
            .setDescription("New name of the item")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("new-description")
            .setDescription("New description of the item")
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("new-price")
            .setDescription("New price of the item")
            .setRequired(false)
        )
        .addRoleOption((opt) =>
          opt
            .setName("new-role")
            .setDescription("New role granted when purchasing this item")
            .setRequired(false)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("delete-item")
        .setDescription("Delete an item from the shop")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Name of the item to delete")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(268435488)
    .setContexts(InteractionContextType.Guild),
  type: "slash",
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "create") {
      const exists = await shopGuild.findOne({ guildId: interaction.guildId! });

      if (exists) {
        return interaction.reply({
          content: "A shop already exists for this server.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const newShop = new shopGuild({
        guildId: interaction.guildId!,
        items: [],
      });
      await newShop.save();

      return interaction.reply({
        content: "Shop created successfully!",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (interaction.options.getSubcommand() === "add-item") {
      const name = interaction.options.getString("name", true);
      const description = interaction.options.getString("description", true);
      const price = interaction.options.getInteger("price", true);
      const role = interaction.options.getRole("role", false);

      const shop = await shopGuild.findOne({ guildId: interaction.guildId! });
      if (!shop) {
        return interaction.reply({
          content: "No shop exists for this server. Create one first.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const existingItem = shop.items.find(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );

      if (existingItem) {
        return interaction.reply({
          content: `Item with name "${name}" already exists in the shop.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const value = role ? role.id : undefined;
      if (role) {
        const botMember = await interaction.guild!.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) {
          return interaction.reply({
            content:
              "I cannot assign a role that is equal to or higher than my highest role.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      shop.items.push({ name, description, price, value });
      await shop.save();

      return interaction.reply({
        content: `Item "${name}" added to the shop successfully!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.options.getSubcommand() === "update-item") {
      const name = interaction.options.getString("name", true);
      const newName = interaction.options.getString("newName", false);
      const newDescription = interaction.options.getString(
        "newDescription",
        false
      );
      const newPrice = interaction.options.getInteger("newPrice", false);
      const newRole = interaction.options.getRole("newRole", false);

      const shop = await shopGuild.findOne({ guildId: interaction.guildId! });
      if (!shop) {
        return interaction.reply({
          content: "No shop exists for this server. Create one first.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const item = shop.items.find(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );
      if (!item) {
        return interaction.reply({
          content: `No item with name "${name}" found in the shop.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (newName) item.name = newName;
      if (newDescription) item.description = newDescription;
      if (newPrice !== null && newPrice !== undefined) item.price = newPrice;

      if (newRole) {
        item.value = newRole.id;
      } else if (newRole === null) {
        item.value = undefined;
      }
      await shop.save();

      return interaction.reply({
        content: `Item "${name}" updated successfully!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.options.getSubcommand() === "delete-item") {
      const name = interaction.options.getString("name", true);

      const shop = await shopGuild.findOne({ guildId: interaction.guildId! });
      if (!shop) {
        return interaction.reply({
          content: "No shop exists for this server. Create one first.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const initinialLength = shop.items.length;
      shop.items = shop.items.filter(
        (i) => i.name.toLowerCase() !== name.toLowerCase()
      );

      if (shop.items.length === initinialLength) {
        return interaction.reply({
          content: `No item with name "${name}" found in the shop.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await shop.save();

      return interaction.reply({
        content: `Item "${name}" deleted successfully!`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
