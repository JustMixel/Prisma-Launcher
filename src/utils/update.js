export function getUpdateName(update)
{
    if (!update) {
        return null;
    }

    const version = typeof update.version === "string" ? update.version.trim() : "";
    const name = typeof update.name === "string" ? update.name.trim() : "";

    if (!version && !name) {
        return null;
    }

    return update.display === "name" ? (name || version) : (version || name);
}

export function getUpdateLabel(update)
{
    const selected = getUpdateName(update);
    return selected ? `Update (${selected})` : null;
}

export function compareVersions(left, right)
{
    const leftText = String(left || "").trim().replace(/^v/i, "");
    const rightText = String(right || "").trim().replace(/^v/i, "");

    if (!leftText || !rightText) {
        return 0;
    }

    const leftParts = leftText.split(/[.-]/);
    const rightParts = rightText.split(/[.-]/);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
        const leftValue = Number.parseInt(leftParts[index] || "0", 10);
        const rightValue = Number.parseInt(rightParts[index] || "0", 10);
        const safeLeft = Number.isNaN(leftValue) ? 0 : leftValue;
        const safeRight = Number.isNaN(rightValue) ? 0 : rightValue;

        if (safeLeft !== safeRight) {
            return safeLeft > safeRight ? 1 : -1;
        }
    }

    return 0;
}

export function getAvailableUpdate(update, installedVersion)
{
    if (!update) {
        return null;
    }

    const updateVersion = typeof update.version === "string" ? update.version.trim() : "";
    if (!updateVersion || !installedVersion) {
        return update;
    }

    return compareVersions(updateVersion, installedVersion) > 0 ? update : null;
}
