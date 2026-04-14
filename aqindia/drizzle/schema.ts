import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  favoriteCities: text("favoriteCities"), // JSON array of city IDs
  alertThreshold: int("alertThreshold").default(150),
  preferredRegion: varchar("preferredRegion", { length: 50 }),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // waqi, openmeteo, nasa, gemini, cpcb
  encryptedKey: text("encryptedKey").notNull(),
  label: varchar("label", { length: 100 }),
  isActive: boolean("isActive").default(true),
  usageCount: int("usageCount").default(0),
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userAlerts = mysqlTable("user_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cityId: varchar("cityId", { length: 50 }).notNull(),
  threshold: int("threshold").notNull(),
  isActive: boolean("isActive").default(true),
  lastTriggered: timestamp("lastTriggered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedReports = mysqlTable("saved_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  reportType: varchar("reportType", { length: 50 }).notNull(), // pdf, csv
  cityIds: text("cityIds"), // JSON array
  dateRange: varchar("dateRange", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type UserAlert = typeof userAlerts.$inferSelect;
