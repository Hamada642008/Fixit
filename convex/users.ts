import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return { user, profile };
  },
});

export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("customer"), v.literal("technician")),
    name: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    const profileData = {
      userId,
      role: args.role,
      name: args.name,
      phone: args.phone,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
    };

    if (args.role === "technician") {
      Object.assign(profileData, {
        specializations: args.specializations || [],
        experience: args.experience || 0,
        rating: 5.0,
        isAvailable: true,
      });
    }

    return await ctx.db.insert("userProfiles", profileData);
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const updates: any = {};
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        updates[key] = value;
      }
    });

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

export const getNearbyTechnicians = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    deviceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const technicians = await ctx.db
      .query("userProfiles")
      .withIndex("by_availability", (q) => 
        q.eq("role", "technician").eq("isAvailable", true)
      )
      .collect();

    // Filter technicians by specialization if deviceType is provided
    let filteredTechnicians = technicians;
    if (args.deviceType) {
      filteredTechnicians = technicians.filter(tech => 
        tech.specializations?.includes(args.deviceType!) || 
        tech.specializations?.includes("all")
      );
    }

    // Calculate distance and sort by proximity
    const techniciansWithDistance = filteredTechnicians
      .filter(tech => tech.latitude && tech.longitude)
      .map(tech => {
        const distance = calculateDistance(
          args.latitude,
          args.longitude,
          tech.latitude!,
          tech.longitude!
        );
        return { ...tech, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Return top 10 closest technicians

    return techniciansWithDistance;
  },
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
