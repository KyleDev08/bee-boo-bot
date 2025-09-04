import { GuildMember } from "discord.js";
import { EconomyGuild, inventoryItem } from "../interface/economy.js";
import { globalEconomy, serverEconomy } from "../models/economy.js";

export const economyManager = {
  getServerUser: async (
    guildId: string,
    userId: string
  ): Promise<EconomyGuild> => {
    let user = await serverEconomy.findOne({ guildId, userId });
    if (!user) {
      user = new serverEconomy({ guildId, userId, balance: 0 });
      await user.save();
    }
    return user;
  },

  addBalance: async (
    guildId: string,
    userId: string,
    amount: number
  ): Promise<EconomyGuild> => {
    const user = await economyManager.getServerUser(guildId, userId);
    user.balance += amount;
    await user.save();
    return user;
  },

  removeBalance: async (
    guildId: string,
    userId: string,
    amount: number
  ): Promise<EconomyGuild> => {
    const user = await economyManager.getServerUser(guildId, userId);
    user.balance -= amount;
    await user.save();
    return user;
  },
};

function addOrUpdateInventory(
  inventory: inventoryItem[],
  itemToAdd: inventoryItem
): inventoryItem[] {
  const existingItem = inventory.find(
    (item) => item.itemId === itemToAdd.itemId
  );

  if (existingItem) {
    existingItem.quantity += itemToAdd.quantity;
  } else {
    inventory.push(itemToAdd);
  }

  return inventory;
}

export const getGlobalUser = async (member: GuildMember) => {
  const userId = member.user.id;
  const userTag = member.user.tag;

  const serverUsers = await serverEconomy.find({ userId });

  let globalBalance = 0;
  let globalBank = 0;
  let globalInventory: inventoryItem[] = [];

  serverUsers.forEach((userDoc) => {
    globalBalance += userDoc.balance;
    globalBank += userDoc.bank;
    userDoc.inventory.forEach((item) => {
      globalInventory = addOrUpdateInventory(globalInventory, item);
    });
  });

  let globalUser = await globalEconomy.findOne({ userId });

  if (!globalUser) {
    globalUser = new globalEconomy({
      userId,
      tag: userTag,
      balance: globalBalance,
      bank: globalBank,
      inventory: globalInventory,
    });
  } else {
    globalUser.balance = globalBalance;
    globalUser.bank = globalBank;
    globalUser.inventory = globalInventory;
    globalUser.tag = userTag;
  }

  await globalUser.save();
  return globalUser;
};
