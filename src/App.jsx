import { useState, useRef } from "react";
import "./App.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hello! Upload PDF / Image / TXT or ask anything." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const addMsg = (msg) => setMessages((p) => [...p, msg]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: "user", text: input.trim() };
    addMsg(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();
      addMsg({ id: Date.now() + 1, from: "bot", text: data.answer || "No response." });

    } catch {
      addMsg({ id: Date.now() + 2, from: "bot", text: "Backend error." });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addMsg({ id: Date.now(), from: "user", text: `Uploaded: ${file.name}` });

    const fd = new FormData();
    fd.append("file", file);

    let endpoint = `${BACKEND}/api/upload/file`;
    if (file.type.includes("pdf")) endpoint = `${BACKEND}/api/upload/pdf`;
    if (file.type.startsWith("image/")) endpoint = `${BACKEND}/api/upload/image`;
    if (file.name.endsWith(".txt")) endpoint = `${BACKEND}/api/upload/text`;

    setLoading(true);
    try {
      const resp = await fetch(endpoint, { method: "POST", body: fd });
      const json = await resp.json();

      let text = json.text || json.message || "Processed.";
      if (text.length > 300) text = text.slice(0, 300) + "...";

      addMsg({ id: Date.now() + 1, from: "bot", text });

    } catch {
      addMsg({ id: Date.now() + 2, from: "bot", text: "Upload error." });
    } finally {
      setLoading(false);
      fileRef.current.value = "";
    }
  };

  return (
    <div className="app">
      <div className="chat-box">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.from}`}>{m.text}</div>
        ))}
      </div>

      <div className="bottom">
        <input type="file" ref={fileRef} onChange={uploadFile} />

        <input
          className="text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
        />

        <button disabled={loading} onClick={sendMessage}>
          {loading ? "..." : "Send"}
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12 }}>
        Backend: {BACKEND}
      </div>
    </div>
  );
}
