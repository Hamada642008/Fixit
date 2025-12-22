import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createServiceRequest = mutation({
  args: {
    deviceType: v.string(),
    deviceBrand: v.string(),
    problemDescription: v.string(),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    customerLocation: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "customer") {
      throw new Error("Only customers can create service requests");
    }

    return await ctx.db.insert("serviceRequests", {
      customerId: userId,
      deviceType: args.deviceType,
      deviceBrand: args.deviceBrand,
      problemDescription: args.problemDescription,
      urgency: args.urgency,
      status: "pending",
      customerLocation: args.customerLocation,
    });
  },
});

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return [];

    if (profile.role === "customer") {
      return await ctx.db
        .query("serviceRequests")
        .withIndex("by_customer", (q) => q.eq("customerId", userId))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("serviceRequests")
        .withIndex("by_technician", (q) => q.eq("technicianId", userId))
        .order("desc")
        .collect();
    }
  },
});

export const getAvailableRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "technician") return [];

    const pendingRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Filter requests based on technician's specializations
    return pendingRequests.filter(request => 
      profile.specializations?.includes(request.deviceType) ||
      profile.specializations?.includes("all")
    );
  },
});

export const assignTechnician = mutation({
  args: {
    requestId: v.id("serviceRequests"),
    estimatedCost: v.optional(v.number()),
    scheduledDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "technician") {
      throw new Error("Only technicians can assign themselves to requests");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not available");
    }

    await ctx.db.patch(args.requestId, {
      technicianId: userId,
      status: "assigned",
      estimatedCost: args.estimatedCost,
      scheduledDate: args.scheduledDate,
    });

    return args.requestId;
  },
});

export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("serviceRequests"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    actualCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    // Check if user is the assigned technician or the customer
    if (request.technicianId !== userId && request.customerId !== userId) {
      throw new Error("Not authorized to update this request");
    }

    const updates: any = { status: args.status };
    
    if (args.status === "completed") {
      updates.completedDate = Date.now();
      if (args.actualCost !== undefined) {
        updates.actualCost = args.actualCost;
      }
    }

    await ctx.db.patch(args.requestId, updates);
    return args.requestId;
  },
});

export const rateService = mutation({
  args: {
    requestId: v.id("serviceRequests"),
    rating: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== userId) {
      throw new Error("Not authorized to rate this service");
    }

    if (request.status !== "completed") {
      throw new Error("Can only rate completed services");
    }

    await ctx.db.patch(args.requestId, {
      customerRating: args.rating,
      customerFeedback: args.feedback,
    });

    // Update technician's average rating
    if (request.technicianId) {
      const techProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", request.technicianId!))
        .unique();

      if (techProfile) {
        const techRequests = await ctx.db
          .query("serviceRequests")
          .withIndex("by_technician", (q) => q.eq("technicianId", request.technicianId!))
          .filter((q) => q.neq(q.field("customerRating"), undefined))
          .collect();

        const totalRating = techRequests.reduce((sum, req) => sum + (req.customerRating || 0), 0) + args.rating;
        const avgRating = totalRating / (techRequests.length + 1);

        await ctx.db.patch(techProfile._id, { rating: avgRating });
      }
    }

    return args.requestId;
  },
});
