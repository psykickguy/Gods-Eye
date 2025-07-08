import React, { useEffect, useState } from "react";
import { Sidebar, ExpansionPanel } from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import SystemStatus from "./SystemStatus";

function DataPanel() {
  const [mediaImages, setMediaImages] = useState([]);
  const [screenshotImages, setScreenshotImages] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/image/grouped")
      .then((res) => res.json())
      .then((data) => {
        setMediaImages(data.media || []);
        setScreenshotImages(data.screenshots || []);
      })
      .catch((err) => console.error("Failed to fetch images:", err));
  }, []);

  return (
    <div className="DataPanel">
      <Sidebar position="right" className="bg-white border-l border-gray-300">
        <ExpansionPanel open title="INFO">
          <p>⚠️ AI flagged a risky file</p>
          <p>
            📄 File name: <strong>log_77.png</strong>
          </p>
          <p>
            Status:{" "}
            <span className="text-yellow-600 font-semibold">Warning</span>
          </p>
        </ExpansionPanel>

        <ExpansionPanel title="MEDIA">
          {mediaImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {mediaImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img.imageUrl}
                  alt={`webcam-${idx}`}
                  className="rounded shadow"
                />
              ))}
            </div>
          ) : (
            <p>📷 No media shared yet.</p>
          )}
        </ExpansionPanel>

        <ExpansionPanel title="DATA ACCESS">
          <p>🔐 Access logs available</p>
          <p>🗓️ Last accessed: 24 June, 5:42 PM</p>
          <p>👤 By: Patrick</p>
        </ExpansionPanel>

        <ExpansionPanel title="SCREENSHOTS">
          {screenshotImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {screenshotImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img.imageUrl}
                  alt={`screenshot-${idx}`}
                  className="rounded shadow"
                />
              ))}
            </div>
          ) : (
            <p>🖼️ No screenshots saved.</p>
          )}
        </ExpansionPanel>

        <ExpansionPanel title="LOGS / VISUALIZATION">
          <p>📊 5 logs available</p>
          <p>📈 Visualization: Active | Errors | Access Pattern</p>
        </ExpansionPanel>

        <ExpansionPanel title="ALERTS">
          <p>📅 Upcoming meeting: 25 June @ 11:00 AM</p>
          <p>🚨 AI Alert: Anomalous token detected at 5:12 PM</p>
        </ExpansionPanel>
      </Sidebar>
    </div>
  );
}

export default DataPanel;
