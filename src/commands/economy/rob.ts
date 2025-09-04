import {
  ChatInputCommandInteraction,
  GuildMember,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { economyManager, getGlobalUser } from "../../utils/economy.js";

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
    const victimUser = interaction.options.getUser("user", true);

    if (robberId === victimUser.id) {
      return interaction.reply({
        content: "No puedes robarte a ti mismo.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (victimUser.bot) {
      return interaction.reply({
        content: "No puedes robar a bots.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const COOLDOWN = 43200000;
    const ROB_CHANCE = 0.5;
    const MIN_BALANCE_TO_ROB = 100;

    const robber = await economyManager.getServerUser(
      interaction.guild!.id,
      robberId
    );
    const victim = await economyManager.getServerUser(
      interaction.guild!.id,
      victimUser.id
    );

    const now = Date.now();
    if (robber.robCooldown && now - robber.robCooldown < COOLDOWN) {
      const remainingTime = (COOLDOWN - (now - robber.robCooldown)) / 1000;
      const minutes = Math.floor(remainingTime / 60);
      const seconds = Math.floor(remainingTime % 60);
      return interaction.reply({
        content: `Ya has intentado robar. Espera ${minutes}m ${seconds}s para intentarlo de nuevo.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (victim.balance < MIN_BALANCE_TO_ROB) {
      return interaction.reply({
        content: `No puedes robar a ${victimUser.username}, tiene muy poco dinero. La víctima debe tener al menos $${MIN_BALANCE_TO_ROB}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const success = Math.random() < ROB_CHANCE;

    if (success) {
      const stolenAmount = Math.floor(
        victim.balance * (Math.random() * 0.25 + 0.05)
      );

      victim.balance -= stolenAmount;
      robber.balance += stolenAmount;

      await victim.save();
      await robber.save();

      await getGlobalUser(interaction.member as GuildMember);
      await getGlobalUser(interaction.guild!.members.cache.get(victimUser.id)!);

      return interaction.reply(
        `¡Te saliste con la tuya! 😈 Robaste **$${stolenAmount}** a ${victimUser.username}.`
      );
    } else {
      const lostAmount = Math.floor(
        robber.balance * (Math.random() * 0.15 + 0.05)
      );
      robber.balance -= lostAmount;
      robber.robCooldown = now;
      await robber.save();

      await getGlobalUser(interaction.member as GuildMember);

      return interaction.reply({
        content: `¡Te atraparon! 👮‍♂️ Fracasaste en el robo y perdiste **$${lostAmount}**.`,
      });
    }
  },
};
