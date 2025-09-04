import {
  ChatInputCommandInteraction,
  GuildMember,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { economyManager,  getGlobalUser } from "../../utils/economy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("Deposit money into your bank")
    .addSubcommand((subc) =>
      subc
        .setName("dep")
        .setDescription("Deposit money into your bank")
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Amount to deposit")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subc) =>
      subc
        .setName("retire")
        .setDescription("Withdraw money from your bank")
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Amount to withdraw")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const user = await economyManager.getServerUser(
      interaction.guild!.id,
      userId
    );

    if (interaction.options.getSubcommand() === "dep") {
      const amount = interaction.options.getInteger("amount", true);

      if (user.balance < amount) {
        return interaction.reply({
          content: "No tienes suficiente dinero para depositar esa cantidad.",
          flags: MessageFlags.Ephemeral,
        });
      }

      user.balance -= amount;
      user.bank += amount;
      await user.save();

      await getGlobalUser(interaction.member as GuildMember);

      return interaction.reply(
        `Has depositado $${amount} en tu banco. Tu nuevo balance es $${user.balance} y el balance de tu banco es $${user.bank}.`
      );
    }

    if (interaction.options.getSubcommand() === "retire") {
      const amount = interaction.options.getInteger("amount", true);

      if (user.bank < amount) {
        return interaction.reply({
          content:
            "No tienes suficiente dinero en tu banco para retirar esa cantidad.",
          flags: MessageFlags.Ephemeral,
        });
      }

      user.balance += amount;
      user.bank -= amount;
      await user.save();

      await getGlobalUser(interaction.member as GuildMember);

      return interaction.reply(
        `Has retirado $${amount} de tu banco. Tu nuevo balance es $${user.balance} y el balance de tu banco es $${user.bank}.`
      );
    }
  },
};
