export const SETTINGS_KEYS = {
    backgroundMode: "prisma-background-mode",
    accentColor: "prisma-accent-color",
    customBackgroundColor: "prisma-custom-background-color",
    customBackgroundImage: "prisma-custom-background-image",
    modsPath: "prisma-mods-path",
    rememberTab: "prisma-remember-tab",
    startupTab: "prisma-startup-tab",
    lastTab: "prisma-last-tab"
};

const DEFAULTS = {
    [SETTINGS_KEYS.backgroundMode]: "image",
    [SETTINGS_KEYS.accentColor]: "#d9cd00",
    [SETTINGS_KEYS.customBackgroundColor]: "#121212",
    [SETTINGS_KEYS.customBackgroundImage]: "",
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
