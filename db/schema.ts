import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const serviceCases = sqliteTable("service_cases", {
  id: text("id").primaryKey(),
  stateJson: text("state_json").notNull(),
  customerTokenHash: text("customer_token_hash").notNull(),
  ownerTokenHash: text("owner_token_hash").notNull(),
  revision: integer("revision").notNull(),
  storageVersion: integer("storage_version").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
