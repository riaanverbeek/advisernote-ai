"use client"

import { useState } from "react"

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState("")
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    // 1️⃣ Transcribe
    const transcribeRes = await fetch("/api/transcribe", {
      method: "POST",
      body: formData
    })

    const transcribeData = await transcribeRes.json()

    setTranscript(transcribeData.text)

    // 2️⃣ Summarise
    const summariseRes = await fetch("/api/summarise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: transcribeData.text
      })
    })

    const summariseData = await summariseRes.json()

    setSummary(summariseData.data)

    setLoading(false)
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => {
          if (e.target.files) setFile(e.target.files[0])
        }}
      />

      <button
        onClick={handleUpload}
        style={{ marginLeft: "10px" }}
      >
        Upload & Process
      </button>

      {loading && <p>Processing...</p>}

      {transcript && (
        <>
          <h2>Transcript</h2>
          <p>{transcript}</p>
        </>
      )}

      {summary && (
        <>
          <h2>Summary</h2>
          <pre>{summary}</pre>
        </>
      )}
    </div>
  )
}