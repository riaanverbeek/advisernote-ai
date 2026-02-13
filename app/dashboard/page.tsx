"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = "/login"
        return
      }

      setLoading(false)
    }

    checkUser()
  }, [])

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading...</div>
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>
      <p>Welcome to AdviserNote AI.</p>
    </div>
  )
}