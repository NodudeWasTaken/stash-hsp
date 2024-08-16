import { sql } from "drizzle-orm"
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const images = sqliteTable("img", {
	id: integer("id").primaryKey().unique(),
	data: blob("data"),
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.default(sql`(current_timestamp)`),
})
export const scans = sqliteTable("scan", {
	id: integer("id").primaryKey().unique(),
	data: text("data", { mode: "json" }),
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.default(sql`(current_timestamp)`),
})
