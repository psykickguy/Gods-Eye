import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import zoeIco from "../avatars/zoe.png";

import ChatHeader from "./ChatHeader";

const commands = ["/help", "/clear", "/ban", "/kick", "/invite"];
const users = ["@Shubham", "@Anjali", "@Devid", "@Patrick"];

function ChatArea() {
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [messages, setMessages] = useState([
    { from: "joe", text: "Hello my friend" },
    { from: "joe", text: "Welcome to the server" },
  ]);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [ollamaPanelOpen, setOllamaPanelOpen] = useState(false);
  const [ollamaMessages, setOllamaMessages] = useState([]); // {role: 'user'|'assistant', content: string}
  const [ollamaInput, setOllamaInput] = useState("");
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaFileId, setOllamaFileId] = useState(null);
  const [ollamaFileName, setOllamaFileName] = useState(null);

  // Filtered messages for search
  const filteredMessages = searchTerm
    ? messages.filter((msg) => msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setDroppedFiles((prev) => [...prev, { file, url }]);
      setMessages((prev) => [
        ...prev,
        { from: "me", text: `Uploaded file: ${file.name}`, fileType: file.type, fileUrl: url, fileName: file.name },
      ]);
      if (ollamaPanelOpen) {
        handleOllamaFileDrop(file);
      }
    }
  };

  useEffect(() => {
    const lastWord = message.split(/\s+/).pop() || "";
    if (lastWord.startsWith("/")) {
      setSuggestions(commands.filter((c) => c.startsWith(lastWord)));
      setActiveIndex(0);
    } else if (lastWord.startsWith("@")) {
      setSuggestions(users.filter((u) => u.startsWith(lastWord)));
      setActiveIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [message]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const acceptSuggestion = (value) => {
    const parts = message.split(/\s+/);
    parts.pop();
    const newMessage = [...parts, value].join(" ") + " ";
    setMessage(newMessage);
    inputRef.current?.focus();
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        acceptSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      setMessages((prev) => [...prev, { from: "me", text: message }]);
      setMessage("");
    }
  };

  // Handle Ollama chat send
  const handleOllamaSend = async () => {
    if (!ollamaInput.trim()) return;
    const newMsg = { role: "user", content: ollamaInput };
    setOllamaMessages((prev) => [...prev, newMsg]);
    setOllamaInput("");
    setOllamaLoading(true);
    try {
      const res = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...ollamaMessages, newMsg],
          fileId: ollamaFileId,
        }),
      });
      const data = await res.json();
      setOllamaMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (e) {
      setOllamaMessages((prev) => [...prev, { role: "assistant", content: "[Error contacting Ollama]" }]);
    }
    setOllamaLoading(false);
  };

  // Handle file drop for Ollama
  const handleOllamaFileDrop = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setOllamaFileName(file.name);
    setOllamaFileId(null);
    try {
      const res = await fetch("/api/ollama/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setOllamaFileId(data.fileId);
    } catch (e) {
      setOllamaFileId(null);
      setOllamaFileName(null);
      setOllamaMessages((prev) => [...prev, { role: "assistant", content: "[File upload failed]" }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <ChatHeader />
      {/* Ollama Side Panel */}
      {ollamaPanelOpen && (
        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-slide-in">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-50">
            <div className="font-semibold text-lg text-gray-800">Ollama Chat (Mistral)</div>
            <button onClick={() => setOllamaPanelOpen(false)} className="p-2 rounded hover:bg-gray-200">
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {ollamaFileName && (
              <div className="mb-2 text-xs text-blue-700">File for Q&A: <span className="font-semibold">{ollamaFileName}</span></div>
            )}
            {ollamaMessages.length === 0 && (
              <div className="text-gray-400 text-center mt-10">Start chatting with Ollama...</div>
            )}
            {ollamaMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-xl px-4 py-2 max-w-xs ${msg.role === "user" ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-900"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-white">
            <form
              className="flex gap-2"
              onSubmit={e => { e.preventDefault(); handleOllamaSend(); }}
            >
              <input
                type="text"
                placeholder="Ask Ollama..."
                value={ollamaInput}
                onChange={e => setOllamaInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none text-gray-900"
                disabled={ollamaLoading}
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                disabled={ollamaLoading}
              >
                <PaperAirplaneIcon className="h-5 w-5 rotate-315" />
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Main Chat Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 bg-white space-y-3 relative ${dragActive ? "ring-4 ring-blue-300" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag-and-drop overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-80 flex items-center justify-center z-20 pointer-events-none rounded-lg">
            <span className="text-blue-700 text-lg font-semibold">Drop file to upload</span>
          </div>
        )}
        {/* Search Button and Input */}
        <div className="flex justify-end mb-2">
          <button
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
            onClick={() => setOllamaPanelOpen(true)}
            title="Ollama Chatbot"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        {/* (Optional) Old search UI can be removed or replaced */}
        {/* Message List */}
        {filteredMessages.map((msg, idx) => {
          // If this message has a fileUrl, show a preview
          if (msg.fileUrl) {
            if (msg.fileType.startsWith("image/")) {
              // Image preview
              return (
                <div key={idx} className="flex justify-end">
                  <div className="bg-blue-400 text-white rounded-xl px-4 py-2 max-w-xs flex flex-col items-end">
                    <img src={msg.fileUrl} alt={msg.fileName} className="max-w-[200px] max-h-[150px] rounded mb-2" />
                    <span className="text-xs text-white">{msg.fileName}</span>
                  </div>
                </div>
              );
            } else if (msg.fileType === "application/pdf") {
              // PDF preview (embed first page if possible, else icon)
              return (
                <div key={idx} className="flex justify-end">
                  <div className="bg-blue-400 text-white rounded-xl px-4 py-2 max-w-xs flex flex-col items-end">
                    <embed src={msg.fileUrl} type="application/pdf" width="200" height="150" className="rounded mb-2" />
                    <span className="text-xs text-white">{msg.fileName}</span>
                  </div>
                </div>
              );
            } else if (
              msg.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
              msg.fileType === "application/msword"
            ) {
              // Word doc preview (icon + filename)
              return (
                <div key={idx} className="flex justify-end">
                  <div className="bg-blue-400 text-white rounded-xl px-4 py-2 max-w-xs flex flex-col items-end">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-xs text-white">{msg.fileName}</span>
                  </div>
                </div>
              );
            } else if (
              msg.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
              msg.fileType === "application/vnd.ms-excel"
            ) {
              // Excel doc preview (icon + filename)
              return (
                <div key={idx} className="flex justify-end">
                  <div className="bg-blue-400 text-white rounded-xl px-4 py-2 max-w-xs flex flex-col items-end">
                    <span className="text-4xl mb-2">📊</span>
                    <span className="text-xs text-white">{msg.fileName}</span>
                  </div>
                </div>
              );
            } else {
              // Generic file preview (icon + filename)
              return (
                <div key={idx} className="flex justify-end">
                  <div className="bg-blue-400 text-white rounded-xl px-4 py-2 max-w-xs flex flex-col items-end">
                    <span className="text-4xl mb-2">📎</span>
                    <span className="text-xs text-white">{msg.fileName}</span>
                  </div>
                </div>
              );
            }
          }
          // Original message rendering for joe/me
          return msg.from === "joe" ? (
            <div key={idx} className="flex items-start gap-2">
              <img src={zoeIco} alt="Joe" className="w-10 h-10 rounded-full" />
              <div className="bg-blue-100 text-black rounded-xl px-4 py-2 max-w-xs">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={idx} className="flex justify-end">
              <div className="bg-blue-400 text-white rounded-xl px-4 py-2 max-w-xs">
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="relative p-4 border-t bg-white">
        {suggestions.length > 0 && (
          <ul className="absolute bottom-14 left-4 mb-2 w-60 bg-white border rounded-lg shadow-lg z-10 text-gray-900">
            {suggestions.map((s, i) => (
              <li
                key={s}
                className={`px-4 py-2 cursor-pointer ${
                  i === activeIndex ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
                onMouseDown={() => acceptSuggestion(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none text-gray-900"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <PaperAirplaneIcon className="h-5 w-5 rotate-315" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatArea;
