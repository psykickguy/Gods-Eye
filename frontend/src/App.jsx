import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import Sidebar from "./components/SideBar";
import ChatArea from "./components/ChatArea";
import DataPanel from "./components/DataPanel";

function App() {
  // const [count, setCount] = useState(0)

  return (
    <PanelGroup direction="horizontal">
      <Panel minSize={20} defaultSize={25}>
        <Sidebar />
      </Panel>
      <PanelResizeHandle />
      <Panel minSize={30} defaultSize={50}>
        <ChatArea />
      </Panel>
      <PanelResizeHandle />
      <Panel minSize={20} defaultSize={25}>
        <DataPanel />
      </Panel>
    </PanelGroup>
  );
}

export default App;
