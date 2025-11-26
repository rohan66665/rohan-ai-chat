import React, { useState, useRef, useEffect } from "react";
import "./App.css";

/**
 * ChatGPT-style single-file App.jsx
 * - Uses VITE_BACKEND_URL from .env
 * - File upload (image/pdf/txt)
 * - Chat bubbles, typing indicator, scroll
 * - Minimal, production-ready
 */

const BACKEND = import.meta.env.VITE_BACKEND_URL;

function Message({ m }) {
  return (
    <div className={`msg ${m.from}`}>
      <div className="bubble">
        {m.text}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hello! I'm Rohan 2.0 — upload a file or ask anything." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const fileRef = useRef();
  const scrollerRef = useRef();

  useEffect(() => {
    // scroll to bottom on messages change
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const addMsg = (m) => setMessages(prev => [...prev, m]);

  // send chat message to backend
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), from: "user", text };
    addMsg(userMsg);
    setInput("");
    setLoading(true);
    setTyping(true);

    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      const botText = json.answer || json.message || json.text || "No response.";
      addMsg({ id: Date.now()+1, from: "bot", text: botText });
    } catch (err) {
      addMsg({ id: Date.now()+2, from: "bot", text: "Backend error — try again." });
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  // helper to choose endpoint based on file type
  const chooseEndpoint = (file) => {
    if (!file) return `${BACKEND}/api/upload/file`;
    if (file.type.includes("pdf")) return `${BACKEND}/api/upload/pdf`;
    if (file.type.startsWith("image/")) return `${BACKEND}/api/upload/image`;
    if (file.name.endsWith(".txt")) return `${BACKEND}/api/upload/text`;
    return `${BACKEND}/api/upload/file`;
  };

  // upload file
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addMsg({ id: Date.now(), from: "user", text: `Uploaded: ${file.name}` });
    const fd = new FormData();
    fd.append("file", file);

    const endpoint = chooseEndpoint(file);
    setLoading(true);
    setTyping(true);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json();
      // backend may return { text, message, summary } etc.
      let text = json.text || json.message || json.summary || "File processed.";
      if (typeof text !== "string") text = JSON.stringify(text).slice(0, 1000);
      if (text.length > 800) text = text.slice(0, 800) + " ...";
      addMsg({ id: Date.now()+1, from: "bot", text });
    } catch (err) {
      addMsg({ id: Date.now()+2, from: "bot", text: "Upload failed." });
    } finally {
      setLoading(false);
      setTyping(false);
      fileRef.current.value = "";
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">R2</div>
          <div className="title">Rohan 2.0 — AI Chat</div>
        </div>

        <div className="side-actions">
          <label className="upload-btn">
            + Upload
            <input ref={fileRef} type="file" onChange={handleUpload} />
          </label>
          <button className="clear-btn" onClick={() => setMessages([{ id: 1, from: "bot", text: "Hello! I'm Rohan 2.0 — upload a file or ask anything." }])}>Clear Chat</button>
        </div>

        <div className="info">
          <div>Backend: <span className="mono">{BACKEND || "not-set"}</span></div>
        </div>
      </aside>

      <main className="main-area">
        <div ref={scrollerRef} className="chat-area">
          {messages.map(m => <Message key={m.id} m={m} />)}
          {typing && <div className="typing">Rohan 2.0 is typing<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></div>}
        </div>

        <div className="composer">
          <textarea
            className="input"
            placeholder="Write a message... (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
          />
          <div className="composer-actions">
            <input type="file" style={{display: "none"}} id="file-inline" onChange={handleUpload} />
            <label htmlFor="file-inline" className="icon-btn">📎</label>
            <button className="send" onClick={sendMessage} disabled={loading}>{loading ? "..." : "Send"}</button>
          </div>
        </div>
      </main>
    </div>
  );
}
