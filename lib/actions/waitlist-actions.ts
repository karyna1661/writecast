"use server"

import { createClient } from "@/lib/supabase/server"

export async function joinWaitlist(email?: string, farcasterUsername?: string) {
  try {
    // Validate input
    if (!email && !farcasterUsername) {
      return {
        data: null,
        error: "Please provide either an email or Farcaster username",
      }
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          data: null,
          error: "Please provide a valid email address",
        }
      }
    }

    const supabase = await createClient()

    // Check if already on waitlist
    let existingQuery = supabase.from("waitlist").select("id")

    if (email) {
      existingQuery = existingQuery.eq("email", email)
    } else if (farcasterUsername) {
      existingQuery = existingQuery.eq("farcaster_username", farcasterUsername)
    }

    const { data: existing } = await existingQuery.single()

    if (existing) {
      return {
        data: null,
        error: "You're already on the waitlist!",
      }
    }

    // Add to waitlist
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        email: email || null,
        farcaster_username: farcasterUsername || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Waitlist error:", error)
      return {
        data: null,
        error: "Failed to join waitlist. Please try again.",
      }
    }

    return {
      data: data,
      error: null,
    }
  } catch (error) {
    console.error("[v0] Waitlist exception:", error)
    return {
      data: null,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getWaitlistCount() {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase.from("waitlist").select("*", { count: "exact", head: true })

    if (error) {
      console.error("[v0] Waitlist count error:", error)
      return { data: null, error: "Failed to get waitlist count" }
    }

    return { data: count, error: null }
  } catch (error) {
    console.error("[v0] Waitlist count exception:", error)
    return { data: null, error: "An unexpected error occurred" }
  }
}
