import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  scores: defineTable({
    userId: v.id("users"),
    score: v.number(),
    playerName: v.string(),
  }).index("by_score", ["score"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
