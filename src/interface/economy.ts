import { Document } from "mongoose";

export interface inventoryItem {
  itemId: string;
  quantity: number;
}

export interface shopItem {
  name: string;
  price: number;
  description: string;
  value?: string;
}

export interface EconomyGuild extends Document {
  guildId: string;
  userId: string;
  balance: number;
  bank: number;
  inventory: inventoryItem[];
  dailyCooldown?: number | undefined ;
  limitWork: number;
  workCooldown?: number;
  repCooldown?: Date;
}

export interface GlobalEconomy extends Document {
  userId: string;
  balance: number;
  bank: number;
  inventory: inventoryItem[];
  tag: string;
}

export interface ShopGuild extends Document {
  guildId: string;
  items: shopItem[];
}
