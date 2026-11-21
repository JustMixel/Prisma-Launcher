import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useDownloads } from "./context/DownloadsContext.jsx";
import { DownloadsProvider } from "./context/DownloadsContext.jsx";
import appBase from "./assets/app-base.png";
import pfpTest from "./assets/pfp-test.png";
import Store from "./components/Store.jsx";
import Downloads from "./components/Downloads.jsx";
import Library from "./components/Library.jsx";
import Configuration, { readStoredPicture } from "./components/Configuration.jsx";
import FirstRunSetup from "./components/FirstRunSetup.jsx";
import { SETTINGS_KEYS, TABS, readSetting, writeSetting } from "./utils/settings.js";
import "./App.css";

function AppContent({ userName, onNameChange })
{
  const [settings, setSettings] = useState(() => ({
    backgroundMode: readSetting(SETTINGS_KEYS.backgroundMode),
    accentColor: readSetting(SETTINGS_KEYS.accentColor),
    modsPath: readSetting(SETTINGS_KEYS.modsPath),
    rememberTab: readSetting(SETTINGS_KEYS.rememberTab) === "true",
    startupTab: readSetting(SETTINGS_KEYS.startupTab)
  }));
  const savedTab = readSetting(SETTINGS_KEYS.lastTab);
  const initialTab = settings.rememberTab && TABS.includes(savedTab) ? savedTab : settings.startupTab;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profilePicture, setProfilePicture] = useState(readStoredPicture);
  const { unseenCount } = useDownloads();

  useEffect(() => {
    if (settings.rememberTab) {
      writeSetting(SETTINGS_KEYS.lastTab, activeTab);
    }
  }, [activeTab, settings.rememberTab]);

  function handleSettingChange(key, value)
  {
    writeSetting(key, typeof value === "boolean" ? String(value) : value);
    setSettings((current) => ({ ...current, [key]: value }));

    if (key === SETTINGS_KEYS.rememberTab) {
      const tab = value ? readSetting(SETTINGS_KEYS.lastTab) : settings.startupTab;
      setActiveTab(TABS.includes(tab) ? tab : "store");
    }

    if (key === SETTINGS_KEYS.startupTab && !settings.rememberTab) {
      setActiveTab(value);
    }
  }

  return(
    <div className="container" style={{ "--accent": settings.accentColor }}>
      <aside className="sidebar">
        <div className="user-box">
          <img src={profilePicture || pfpTest} alt="You." className="profile-pic"/>
          <div className="user-info">
            <h3>{userName || "User Name"}</h3>
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
        Downloads{unseenCount > 0 && <span className="download-badge">{unseenCount}</span>}
      </button>

      <button className={activeTab === "configuration" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("configuration")}>
        Configuration
      </button>

    </nav>
    </aside>

    <main
      className="main-content"
      style={settings.backgroundMode === "image"
        ? { backgroundImage: `url(${appBase})`, backgroundColor: "#1e1e1e" }
        : { backgroundImage: "none", backgroundColor: "#121212" }}
    >
      {activeTab === "store" && <Store />}
      {activeTab === "library" && <Library />}
      {activeTab === "downloads" && <Downloads />}
      {activeTab === "configuration" && (
        <Configuration
          userName={userName}
          onNameChange={onNameChange}
          profilePicture={profilePicture}
          onPictureChange={setProfilePicture}
          settings={settings}
          onSettingChange={handleSettingChange}
        />
      )}
    </main>
    </div>
  );
}

function App()
{
    const [launchState, setLaunchState] = useState(null);
    const [windowLabel, setWindowLabel] = useState(null);
    const [bootError, setBootError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function boot() {
            try {
                const [state, label] = await Promise.all([
                    invoke("initialize_launcher"),
                    invoke("get_window_label")
                ]);
                if (!cancelled) {
                    setLaunchState(state);
                    setWindowLabel(label);
                }
            } catch (error) {
                if (!cancelled) {
                    setBootError(String(error));
                }
            }
        }

        boot();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let unlisten = null;

        listen("prisma-setup-complete", async () => {
            try {
                const state = await invoke("initialize_launcher");
                setLaunchState(state);
            } catch (error) {
                console.error(error);
            }
        }).then((callback) => { unlisten = callback; });

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, []);

    if (bootError) {
        return (
            <div className="boot-screen">
                <p>No se pudo iniciar Prisma Launcher.</p>
                <p className="boot-error">{bootError}</p>
                <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
        );
    }

    if (!launchState || !windowLabel) {
        return <div className="boot-screen">Iniciando Prisma Launcher...</div>;
    }

    if (windowLabel === "setup") {
        return <FirstRunSetup />;
    }

    return (
        <DownloadsProvider>
            <AppContent
                userName={launchState.user_name}
                onNameChange={(name) => setLaunchState((current) => current ? { ...current, user_name: name } : current)}
            />
        </DownloadsProvider>
    );
}

export default App;
