import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export default async function Dashboard() {
  const cookieStore = cookies()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscribed, subscription_expires_at")
    .eq("id", user.id)
    .single()

  if (
    !profile?.subscribed ||
    !profile.subscription_expires_at ||
    new Date(profile.subscription_expires_at) < new Date()
  ) {
    redirect("/subscribe")
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>
      <p>Welcome to AdviserNote AI.</p>
    </div>
  )
}