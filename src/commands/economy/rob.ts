import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import economyManager from "../../utils/economy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Rob another user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to rob").setRequired(true)
    )
    .setContexts(InteractionContextType.Guild),
  type: "slash",
  async execute(interaction: ChatInputCommandInteraction) {
    const robberId = interaction.user.id;
    const victimId = interaction.options.getUser("user", true);

    if (robberId === victimId.id) {
      return interaction.reply({
        content: "You cannot rob yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (victimId.bot) {
      return interaction.reply({
        content: "You cannot rob bots.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const robber = await economyManager.getServerUser(
      interaction.guildId!,
      robberId
    );
    const victim = await economyManager.getServerUser(
      interaction.guildId!,
      victimId.id
    );

    if (victim.balance < 0) {
      return interaction.reply({
        content: "You cannot rob a user with a negative balance.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const stolen = Math.floor(Math.random() * victim.balance) + 1;
    victim.balance -= stolen;
    robber.balance += stolen;

    await victim.save();
    await robber.save();
    return interaction.reply(
      `You have successfully robbed ${stolen} coins from ${victimId.username}.`
    );
  },
};
