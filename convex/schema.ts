import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with role-based access
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("customer"), v.literal("technician")),
    name: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    // For technicians
    specializations: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    rating: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    // Location coordinates
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_availability", ["role", "isAvailable"]),

  // Service requests
  serviceRequests: defineTable({
    customerId: v.id("users"),
    technicianId: v.optional(v.id("users")),
    deviceType: v.string(),
    deviceBrand: v.string(),
    problemDescription: v.string(),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    customerLocation: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
    estimatedCost: v.optional(v.number()),
    actualCost: v.optional(v.number()),
    scheduledDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    customerRating: v.optional(v.number()),
    customerFeedback: v.optional(v.string()),
  })
    .index("by_customer", ["customerId"])
    .index("by_technician", ["technicianId"])
    .index("by_status", ["status"])
    .searchIndex("search_requests", {
      searchField: "problemDescription",
      filterFields: ["deviceType", "status"],
    }),

  // Messages between customers and technicians
  messages: defineTable({
    requestId: v.id("serviceRequests"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("image")),
  })
    .index("by_request", ["requestId"])
    .index("by_sender", ["senderId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
