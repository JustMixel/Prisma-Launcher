import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import appBase from "./assets/app-base.png";
import pfpTest from "./assets/pfp-test.png";
import Store from "./components/Store.jsx";

function App() 
{
  const [activeTab, setActiveTab] = useState();

  return(
    <>
    <div className="container">
      <aside className="sidebar">
        <div className="user-box">
          <img src={pfpTest} alt="You." className="profile-pic"/>
          <div className="user-info">
            <h3>User Name</h3>
            <p>User Role</p>
          </div>
        </div>

    <nav className="nav">
      <button className={activeTab === "store" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("store")}>
        Store
      </button>

      <button className={activeTab === "library" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("library")}>
        Library
      </button>

      <button className={activeTab === "downloads" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("downloads")}>
        Downloads
      </button>

      <button className={activeTab === "configuration" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("configuration")}>
        Configuration
      </button>

    </nav>
    </aside>

    <main className="main-content" style={{ backgroundImage: `url(${appBase})` }}>
      {activeTab === "store" && <Store />}
      {activeTab === "library" && <h2 className="tab-title">Library Content</h2>}
      {activeTab === "downloads" && <h2 className="tab-title">Downloads Content</h2>}
      {activeTab === "configuration" && <h2 className="tab-title">Configuration Content</h2>}
    </main>
    </div>
    </>
  );
}

export default App;
