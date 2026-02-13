import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    console.log("Transcribe route hit")
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log("File received:", file?.name)

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    })

    console.log("Transcript:", transcription.text)

    return Response.json({ text: transcription.text })

  } catch (error) {
    console.error(error)
    return Response.json({ error: "Transcription failed" }, { status: 500 })
  }
}
