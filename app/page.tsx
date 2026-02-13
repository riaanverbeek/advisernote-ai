export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>AdviserNote AI</h1>
      <p>AI meeting notes for financial advisers.</p>

      <div style={{ marginTop: "20px" }}>
        <a href="/login">
          <button style={{ padding: "10px 20px", marginRight: "10px" }}>
            Login
          </button>
        </a>

        <a href="/dashboard">
          <button style={{ padding: "10px 20px" }}>
            Dashboard
          </button>
        </a>
      </div>
    </main>
  )
}