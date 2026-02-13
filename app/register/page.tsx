"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Check your email to confirm your account.")
      window.location.href = "/login"
    }
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Register</h1>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <button onClick={handleRegister}>
        Create Account
      </button>
    </div>
  )
}