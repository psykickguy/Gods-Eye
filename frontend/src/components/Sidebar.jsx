// import Logo from "./Logo.jsx";
// import AddButton from "./AddButton.jsx";
// import "./style.css";

// function Sidebar() {
//   return (
//     <div className="sidebar">
//       <Logo />
//       <h1>Sidebar</h1>
//       <AddButton />
//     </div>
//   );
// }

// export default Sidebar;

import React from "react";
import {
  Search,
  ConversationList,
  Conversation,
  Avatar,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

import Logo from "./Logo.jsx";
import AddButton from "./AddButton.jsx";

// import lillyIco from "./avatars/lilly.png";
// import joeIco from "./avatars/joe.png";
// import emilyIco from "./avatars/emily.png";
// import kaiIco from "./avatars/kai.png";
// import akaneIco from "./avatars/akane.png";
// import eliotIco from "./avatars/eliot.png";
import zoeIco from "../avatars/zoe.png";
// import patrikIco from "./avatars/patrik.png";

import "./style.css";

export default function Sidebar() {
  const users = [
    // { key: "1", name: "Lilly", icon: lillyIco },
    // { key: "2", name: "Joe", icon: joeIco },
    // { key: "3", name: "Emily", icon: emilyIco },
    // { key: "4", name: "Kai", icon: kaiIco },
    // { key: "5", name: "Akane", icon: akaneIco },
    // { key: "6", name: "Eliot", icon: eliotIco },
    { key: "1", name: "Zoe", icon: zoeIco },
    // { key: "8", name: "Patrik", icon: patrikIco },
  ];

  return (
    <div
      className="sidebar"
      // style={{
      //   height: "100%",
      //   display: "flex",
      //   flexDirection: "column",
      // }}
    >
      {/* Top: Logo */}
      {/* <div style={{ padding: "16px", borderBottom: "1px solid #ccc" }}> */}
      <Logo />
      {/* </div> */}

      {/* Middle: Search + Conversations */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 0",
        }}
      >
        <div className="search">
          <Search placeholder="Search..." />
        </div>
        <div className="ConversationList">
          <ConversationList>
            {users.map((user) => (
              <Conversation
                key={user.key}
                name={user.name}
                lastSenderName={user.name}
                info="Yes I can do it for you"
              >
                <Avatar src={user.icon} name={user.name} status="available" />
              </Conversation>
            ))}
          </ConversationList>
        </div>
      </div>

      {/* Bottom: AddButton */}
      {/* <div style={{ position: "relative", bottom: "0" }}> */}
      <AddButton />
      {/* </div> */}
    </div>
  );
}
