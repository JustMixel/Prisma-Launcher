const SESSION_KEY = "prisma-session";

export function getSession()
{
    try {
        const parsed = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (!parsed || typeof parsed !== "object" || typeof parsed.username !== "string") {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveSession(user)
{
    try {
        const session = {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            role: user.role || "member",
            activated: user.activated === true
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    } catch {
        return null;
    }
}

export function clearSession()
{
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        // almacenamiento no disponible
    }
}
