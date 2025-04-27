import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveScore = mutation({
  args: { score: v.number(), playerName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    return await ctx.db.insert("scores", {
      userId: identity.subject as any,
      score: args.score,
      playerName: args.playerName,
    });
  },
});

export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("desc")
      .take(5);
  },
});
