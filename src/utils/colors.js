// Inventario de colores del Launcher: cada color con su escala (sub-colores).
// Los valores por defecto viven en :root (App.css); los overrides del usuario
// se guardan en localStorage (prisma-color-overrides) como { "--c-x": "#hex" }.
// Las entradas con deriveFrom se calculan solas a partir de otra entrada
// (se aclaran con lightenHex) y no son editables.

const COLOR_GROUPS = [
    {
        id: "gris",
        label: "Color 1",
        subtitle: "Gris",
        entries: [
            { id: "gris-1", cssVar: "--c-gris-1", label: "Sub-color 1", value: "#080807", where: "Superficie base — sidebar, navegación y footer" },
            { id: "gris-2", cssVar: "--c-gris-2", label: "Sub-color 2", value: "#0f0f0e", where: "Superficie activa — pestaña y botón activo" },
            { id: "gris-3", cssVar: "--c-gris-3", label: "Sub-color 3", value: "#121211", where: "Tarjeta — tarjetas de la Store y barras de búsqueda" },
            { id: "gris-4", cssVar: "--c-gris-4", label: "Sub-color 4", value: "#1e1e1e", where: "Panel — fondo principal, paneles y modales" },
            { id: "gris-5", cssVar: "--c-gris-5", label: "Sub-color 5", value: "#24221e", where: "Caja de usuario — recuadro en la sidebar" },
            { id: "gris-6", cssVar: "--c-gris-6", label: "Sub-color 6", value: "#2a2a2a", where: "Superficie elevada — inputs, switches y cabeceras" },
            { id: "gris-7", cssVar: "--c-gris-7", label: "Sub-color 7", value: "#2b2b3a", where: "Botón secundario — gear, riel y secundarios" },
            { id: "gris-8", cssVar: "--c-gris-8", label: "Sub-color 8", value: "#33333f", where: "Botón secundario claro — hover" },
            { id: "gris-9", cssVar: "--c-gris-9", label: "Sub-color 9", value: "#3a3a3a", where: "Borde tenue — bordes sutiles y divisores" },
            { id: "gris-10", cssVar: "--c-gris-10", label: "Sub-color 10", value: "#555555", where: "Borde — paneles y controles" },
            { id: "gris-11", cssVar: "--c-gris-11", label: "Sub-color 11", value: "#777777", where: "Borde fuerte — inputs y selects" },
            { id: "gris-12", cssVar: "--c-gris-12", label: "Sub-color 12", value: "#9a9a9a", where: "Texto terciario — textos apagados y etiquetas" },
            { id: "gris-13", cssVar: "--c-gris-13", label: "Sub-color 13", value: "#b8b8b8", where: "Texto secundario — subtítulos y descripciones" },
            { id: "gris-14", cssVar: "--c-gris-14", label: "Sub-color 14", value: "#d0d0d0", where: "Texto — labels y texto general" },
            { id: "gris-15", cssVar: "--c-gris-15", label: "Sub-color 15", value: "#e8e8e8", where: "Texto claro — textos de tarjetas y paneles" },
            { id: "gris-16", cssVar: "--c-gris-16", label: "Sub-color 16", value: "#f0f0f0", where: "Texto brillante — títulos y botones" },
            { id: "gris-17", cssVar: "--c-gris-17", label: "Sub-color 17", value: "#ffffff", where: "Blanco puro — títulos, iconos y textos destacados" }
        ]
    },
    {
        id: "negro",
        label: "Color 2",
        subtitle: "Negro",
        entries: [
            { id: "negro-1", cssVar: "--c-negro-1", label: "Sub-color 1", value: "#000000", where: "Negro puro — botones, cabeceras y fondos de modal" },
            { id: "negro-2", cssVar: "--c-negro-2", label: "Sub-color 2", value: "#111111", where: "Casi negro — bordes oscuros y texto sobre color" }
        ]
    },
    {
        id: "amarillo",
        label: "Color 3",
        subtitle: "Amarillo",
        entries: [
            { id: "acento", cssVar: "--accent", label: "Sub-color 1", value: "#d9cd00", where: "Acento — color general de tabs, bordes y botones", accent: true },
            { id: "acento-claro", cssVar: "--c-accent-claro", label: "Sub-color 2", value: "#f0e033", where: "Acento claro — hover de botones con acento. Se genera automáticamente aclarando el Sub-color 1", deriveFrom: "acento" }
        ]
    },
    {
        id: "dorado",
        label: "Color 4",
        subtitle: "Dorado",
        entries: [
            { id: "gold-1", cssVar: "--c-gold-1", label: "Sub-color 1", value: "#f5d000", where: "Dorado brillante — badges de cuenta regresiva y estrellas" },
            { id: "gold-2", cssVar: "--c-gold-2", label: "Sub-color 2", value: "#c99600", where: "Dorado oscuro — final del gradiente de badges" },
            { id: "gold-3", cssVar: "--c-gold-3", label: "Sub-color 3", value: "#d8cd7a", where: "Dorado texto — rating y bordes dorados" }
        ]
    },
    {
        id: "verde",
        label: "Color 5",
        subtitle: "Verde",
        entries: [
            { id: "green-1", cssVar: "--c-green-1", label: "Sub-color 1", value: "#16a316", where: "Verde — botón JUGAR" },
            { id: "green-2", cssVar: "--c-green-2", label: "Sub-color 2", value: "#1dbd1d", where: "Verde claro — hover de JUGAR" },
            { id: "green-3", cssVar: "--c-green-3", label: "Sub-color 3", value: "#8fc98f", where: "Verde apagado — JUGAR deshabilitado" },
            { id: "green-4", cssVar: "--c-green-4", label: "Sub-color 4", value: "#a8d08a", where: "Verde éxito — avisos de éxito y chips" },
            { id: "green-5", cssVar: "--c-green-5", label: "Sub-color 5", value: "#3d9a44", where: "Verde badge — badges de estado positivo" },
            { id: "green-6", cssVar: "--c-green-6", label: "Sub-color 6", value: "#2d5a2d", where: "Verde oscuro — fondo de badges de lanzamiento" }
        ]
    },
    {
        id: "rojo",
        label: "Color 6",
        subtitle: "Rojo",
        entries: [
            { id: "red-1", cssVar: "--c-red-1", label: "Sub-color 1", value: "#b32d2d", where: "Rojo — badge de descargas y peligro" },
            { id: "red-2", cssVar: "--c-red-2", label: "Sub-color 2", value: "#e07878", where: "Rojo claro — mensajes de error" },
            { id: "red-3", cssVar: "--c-red-3", label: "Sub-color 3", value: "#ff5a5a", where: "Rojo brillante — acciones destructivas" },
            { id: "red-4", cssVar: "--c-red-4", label: "Sub-color 4", value: "#8b0015", where: "Rojo profundo — badge de instalado" },
            { id: "red-5", cssVar: "--c-red-5", label: "Sub-color 5", value: "#7a2020", where: "Rojo oscuro — fondo de badges rojos" }
        ]
    }
];

const COLOR_DEFAULTS = {};
for (const group of COLOR_GROUPS) {
    for (const entry of group.entries) {
        COLOR_DEFAULTS[entry.cssVar] = entry.value;
    }
}

// Mezcla el color con blanco: sirve para derivar Sub-colores claros
// a partir de su Sub-color base (ej: el acento claro sale del acento).
function lightenHex(hex, amount = 0.25)
{
    const clean = String(hex || "").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
        return hex;
    }
    const num = parseInt(clean, 16);
    const mix = (channel) => Math.round(channel + (255 - channel) * amount);
    const r = mix((num >> 16) & 255);
    const g = mix((num >> 8) & 255);
    const b = mix(num & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function parseColorOverrides(raw)
{
    try {
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

const GRADIENT_DEFAULT = { from: "#080807", to: "#2b2b3a", angle: 135 };

function parseGradient(raw)
{
    const parsed = parseColorOverrides(raw);
    return {
        from: typeof parsed.from === "string" ? parsed.from : GRADIENT_DEFAULT.from,
        to: typeof parsed.to === "string" ? parsed.to : GRADIENT_DEFAULT.to,
        angle: Number.isFinite(Number(parsed.angle)) ? Number(parsed.angle) : GRADIENT_DEFAULT.angle
    };
}

export { COLOR_GROUPS, COLOR_DEFAULTS, lightenHex, parseColorOverrides, parseGradient, GRADIENT_DEFAULT };
