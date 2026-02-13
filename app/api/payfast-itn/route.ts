import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function POST(req: Request) {
  const formData = await req.formData()

  const data: Record<string, string> = {}
  formData.forEach((value, key) => {
    data[key] = value.toString()
  })

  const receivedSignature = data.signature
  delete data.signature

  const passphrase = process.env.PAYFAST_PASSPHRASE!

  // 1️⃣ Recreate signature
  const pfParamString = Object.keys(data)
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join("&")

  const calculatedSignature = crypto
    .createHash("md5")
    .update(pfParamString + `&passphrase=${encodeURIComponent(passphrase)}`)
    .digest("hex")

  if (calculatedSignature !== receivedSignature) {
    return new Response("Invalid signature", { status: 400 })
  }

  // 2️⃣ Validate with PayFast server
  const validationResponse = await fetch(
    "https://sandbox.payfast.co.za/eng/query/validate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: pfParamString
    }
  )

  const validationText = await validationResponse.text()

  if (validationText !== "VALID") {
    return new Response("Invalid ITN validation", { status: 400 })
  }

  const payment_status = data.payment_status
  const userId = data.m_payment_id

  if (!userId) {
    return new Response("Missing user ID", { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3️⃣ Handle successful payment
  if (payment_status === "COMPLETE") {
    const newExpiry = new Date()
    newExpiry.setMonth(newExpiry.getMonth() + 1)

    await supabase
      .from("profiles")
      .update({
        subscribed: true,
        subscription_expires_at: newExpiry.toISOString()
      })
      .eq("id", userId)
  }

  // 4️⃣ Handle failed payment
  if (payment_status === "FAILED" || payment_status === "CANCELLED") {
    await supabase
      .from("profiles")
      .update({
        subscribed: false
      })
      .eq("id", userId)
  }

  return new Response("OK")
}