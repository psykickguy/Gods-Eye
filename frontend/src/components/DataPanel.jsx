import React, { useState } from "react";

function DataPanel() {
  const [openPanels, setOpenPanels] = useState({
    info: true,
    media: false,
    dataAccess: false,
    screenshots: false,
    logs: false,
    alerts: false
  });

  const togglePanel = (panel) => {
    setOpenPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  return (
    <div className="h-full bg-gray-50 border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Panel</h2>
        
        {/* INFO Panel */}
        <div className="mb-4">
          <button
            onClick={() => togglePanel('info')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <span className="font-medium text-gray-700">INFO</span>
            <span className={`transform transition-transform ${openPanels.info ? 'rotate-180' : ''} text-blue-500`}>
              ▼
            </span>
          </button>
          {openPanels.info && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-yellow-600 mb-2">⚠️ AI flagged a risky file</p>
              <p className="text-sm text-gray-600 mb-1">
                📄 File name: <strong>log_77.png</strong>
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className="text-yellow-600 font-semibold">Warning</span>
              </p>
            </div>
          )}
        </div>

        {/* MEDIA Panel */}
        <div className="mb-4">
          <button
            onClick={() => togglePanel('media')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <span className="font-medium text-gray-700">MEDIA</span>
            <span className={`transform transition-transform ${openPanels.media ? 'rotate-180' : ''} text-blue-500`}>
              ▼
            </span>
          </button>
          {openPanels.media && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">📷 No media shared yet.</p>
            </div>
          )}
        </div>

        {/* DATA ACCESS Panel */}
        <div className="mb-4">
          <button
            onClick={() => togglePanel('dataAccess')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <span className="font-medium text-gray-700">DATA ACCESS</span>
            <span className={`transform transition-transform ${openPanels.dataAccess ? 'rotate-180' : ''} text-blue-500`}>
              ▼
            </span>
          </button>
          {openPanels.dataAccess && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-1">🔐 Access logs available</p>
              <p className="text-sm text-gray-600 mb-1">🗓️ Last accessed: 24 June, 5:42 PM</p>
              <p className="text-sm text-gray-600">👤 By: Patrick</p>
            </div>
          )}
        </div>

        {/* SCREENSHOTS Panel */}
        <div className="mb-4">
          <button
            onClick={() => togglePanel('screenshots')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <span className="font-medium text-gray-700">SCREENSHOTS</span>
            <span className={`transform transition-transform ${openPanels.screenshots ? 'rotate-180' : ''} text-blue-500`}>
              ▼
            </span>
          </button>
          {openPanels.screenshots && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-2">🖼️ 3 screenshots saved</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>dashboard_ss1.png</li>
                <li>error_trace.png</li>
                <li>user_activity.png</li>
              </ul>
            </div>
          )}
        </div>

        {/* LOGS Panel */}
        <div className="mb-4">
          <button
            onClick={() => togglePanel('logs')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <span className="font-medium text-gray-700">LOGS / VISUALIZATION</span>
            <span className={`transform transition-transform ${openPanels.logs ? 'rotate-180' : ''} text-blue-500`}>
              ▼
            </span>
          </button>
          {openPanels.logs && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-1">📊 5 logs available</p>
              <p className="text-sm text-gray-600">📈 Visualization: Active | Errors | Access Pattern</p>
            </div>
          )}
        </div>

        {/* ALERTS Panel */}
        <div className="mb-4">
          <button
            onClick={() => togglePanel('alerts')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <span className="font-medium text-gray-700">ALERTS</span>
            <span className={`transform transition-transform ${openPanels.alerts ? 'rotate-180' : ''} text-blue-500`}>
              ▼
            </span>
          </button>
          {openPanels.alerts && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-1">📅 Upcoming meeting: 25 June @ 11:00 AM</p>
              <p className="text-sm text-red-600">🚨 AI Alert: Anomalous token detected at 5:12 PM</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataPanel;
