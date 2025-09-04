import { model, Schema } from "mongoose";
import {
  EconomyGuild,
  GlobalEconomy,
  inventoryItem,
  ShopGuild,
  shopItem,
} from "../interface/economy.js";

const inventoryItemSchema = new Schema<inventoryItem>({
  itemId: { type: String, required: true },
  quantity: { type: Number, default: 1 },
});
const shopItemSchema = new Schema<shopItem>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: "" },
  value: { type: String, default: undefined },
});

export const serverEconomy = model(
  "serverEconomy",
  new Schema<EconomyGuild>({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    balance: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    inventory: { type: [inventoryItemSchema], default: [] },
    dailyCooldown: { type: Number, default: undefined },
    limitWork: { type: Number, default: 0 },
    workCooldown: { type: Number, default: null },
    robCooldown: { type: Date, default: null },
  }).index({ guildId: 1, userId: 1 }, { unique: true })
);

export const globalEconomy = model(
  "globalEconomy",
  new Schema<GlobalEconomy>({
    userId: { type: String, required: true },
    balance: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    inventory: { type: [inventoryItemSchema], default: [] },
    tag: { type: String, required: true },
  })
);

export const shopGuild = model(
  "shopGuild",
  new Schema<ShopGuild>({
    guildId: { type: String, required: true },
    items: { type: [shopItemSchema], default: [] },
  })
);
