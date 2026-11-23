export const SETTINGS_KEYS = {
    backgroundType: "prisma-background-type",
    accentColor: "prisma-accent-color",
    customBackgroundColor: "prisma-custom-background-color",
    customBackgroundImage: "prisma-custom-background-image",
    customGradient: "prisma-custom-gradient",
    colorOverrides: "prisma-color-overrides",
    modsPath: "prisma-mods-path",
    rememberTab: "prisma-remember-tab",
    startupTab: "prisma-startup-tab",
    lastTab: "prisma-last-tab"
};

const DEFAULTS = {
    [SETTINGS_KEYS.backgroundType]: "image",
    [SETTINGS_KEYS.accentColor]: "#d9cd00",
    [SETTINGS_KEYS.customBackgroundColor]: "#121212",
    [SETTINGS_KEYS.customBackgroundImage]: "",
    [SETTINGS_KEYS.customGradient]: JSON.stringify({ from: "#080807", to: "#2b2b3a", angle: 135 }),
    [SETTINGS_KEYS.colorOverrides]: "{}",
    [SETTINGS_KEYS.modsPath]: "",
    [SETTINGS_KEYS.rememberTab]: "true",
    [SETTINGS_KEYS.startupTab]: "store",
    [SETTINGS_KEYS.lastTab]: "store"
};

export const TABS = ["store", "library", "downloads", "configuration", "creator"];

export function readSetting(key)
{
    try {
        return localStorage.getItem(key) ?? DEFAULTS[key];
    } catch {
        return DEFAULTS[key];
    }
}

export function writeSetting(key, value)
{
    try {
        localStorage.setItem(key, value);
    } catch {
        return;
    }
}
