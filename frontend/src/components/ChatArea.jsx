import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const commands = ["/help", "/clear", "/ban", "/kick", "/invite"];
const users = ["@Shubham", "@Anjali", "@Devid", "@Patrick"];

function ChatArea() {
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

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
      console.log("Send message:", message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="text-gray-500 text-sm">No messages yet...</div>
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
