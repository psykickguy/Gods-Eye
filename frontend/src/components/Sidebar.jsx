import Logo from "./Logo.jsx";
import AddButton from "./AddButton.jsx";
import "./style.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <Logo />
      <h1>Sidebar</h1>
      <AddButton />
    </div>
  );
}

export default Sidebar;
