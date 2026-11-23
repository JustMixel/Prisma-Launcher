// Inventario de colores del Launcher: cada color con su escala (sub-colores).
// Los valores por defecto viven en :root (App.css); los overrides del usuario
// se guardan en localStorage (prisma-color-overrides) como { "--c-x": "#hex" }.

const COLOR_GROUPS = [
    {
        id: "gris",
        label: "Color 1 [Gris]",
        entries: [
            { id: "gris-1", cssVar: "--c-gris-1", label: "Sub-color 1 [Superficie base]", value: "#080807", where: "Sidebar, navegación y footer" },
            { id: "gris-2", cssVar: "--c-gris-2", label: "Sub-color 2 [Superficie activa]", value: "#0f0f0e", where: "Pestaña y botón activo" },
            { id: "gris-3", cssVar: "--c-gris-3", label: "Sub-color 3 [Tarjeta]", value: "#121211", where: "Tarjetas de la Store y barras de búsqueda" },
            { id: "gris-4", cssVar: "--c-gris-4", label: "Sub-color 4 [Panel]", value: "#1e1e1e", where: "Fondo principal, paneles y modales" },
            { id: "gris-5", cssVar: "--c-gris-5", label: "Sub-color 5 [Caja de usuario]", value: "#24221e", where: "Recuadro de usuario en la sidebar" },
            { id: "gris-6", cssVar: "--c-gris-6", label: "Sub-color 6 [Superficie elevada]", value: "#2a2a2a", where: "Inputs, switches y cabeceras" },
            { id: "gris-7", cssVar: "--c-gris-7", label: "Sub-color 7 [Botón secundario]", value: "#2b2b3a", where: "Botones gear, riel y secundarios" },
            { id: "gris-8", cssVar: "--c-gris-8", label: "Sub-color 8 [Botón secundario claro]", value: "#33333f", where: "Hover de botones secundarios" },
            { id: "gris-9", cssVar: "--c-gris-9", label: "Sub-color 9 [Borde tenue]", value: "#3a3a3a", where: "Bordes sutiles y divisores" },
            { id: "gris-10", cssVar: "--c-gris-10", label: "Sub-color 10 [Borde]", value: "#555555", where: "Bordes de paneles y controles" },
            { id: "gris-11", cssVar: "--c-gris-11", label: "Sub-color 11 [Borde fuerte]", value: "#777777", where: "Bordes de inputs y selects" },
            { id: "gris-12", cssVar: "--c-gris-12", label: "Sub-color 12 [Texto terciario]", value: "#9a9a9a", where: "Textos apagados y etiquetas" },
            { id: "gris-13", cssVar: "--c-gris-13", label: "Sub-color 13 [Texto secundario]", value: "#b8b8b8", where: "Subtítulos y descripciones" },
            { id: "gris-14", cssVar: "--c-gris-14", label: "Sub-color 14 [Texto]", value: "#d0d0d0", where: "Labels y texto general" },
            { id: "gris-15", cssVar: "--c-gris-15", label: "Sub-color 15 [Texto claro]", value: "#e8e8e8", where: "Textos de tarjetas y paneles" },
            { id: "gris-16", cssVar: "--c-gris-16", label: "Sub-color 16 [Texto brillante]", value: "#f0f0f0", where: "Títulos y botones" },
            { id: "gris-17", cssVar: "--c-gris-17", label: "Sub-color 17 [Blanco puro]", value: "#ffffff", where: "Títulos, iconos y textos destacados" }
        ]
    },
    {
        id: "negro",
        label: "Color 2 [Negro]",
        entries: [
            { id: "negro-1", cssVar: "--c-negro-1", label: "Sub-color 1 [Negro puro]", value: "#000000", where: "Botones, cabeceras y fondos de modal" },
            { id: "negro-2", cssVar: "--c-negro-2", label: "Sub-color 2 [Casi negro]", value: "#111111", where: "Bordes oscuros y texto sobre color" }
        ]
    },
    {
        id: "amarillo",
        label: "Color 3 [Amarillo]",
        entries: [
            { id: "acento", cssVar: "--accent", label: "Sub-color 1 [Acento]", value: "#d9cd00", where: "Color de acento (también en los swatches)", accent: true },
            { id: "acento-claro", cssVar: "--c-accent-claro", label: "Sub-color 2 [Acento claro]", value: "#f0e033", where: "Hover de botones con acento" }
        ]
    },
    {
        id: "dorado",
        label: "Color 4 [Dorado]",
        entries: [
            { id: "gold-1", cssVar: "--c-gold-1", label: "Sub-color 1 [Dorado brillante]", value: "#f5d000", where: "Badges de cuenta regresiva y estrellas" },
            { id: "gold-2", cssVar: "--c-gold-2", label: "Sub-color 2 [Dorado oscuro]", value: "#c99600", where: "Final del gradiente de badges" },
            { id: "gold-3", cssVar: "--c-gold-3", label: "Sub-color 3 [Dorado texto]", value: "#d8cd7a", where: "Rating y bordes dorados" }
        ]
    },
    {
        id: "verde",
        label: "Color 5 [Verde]",
        entries: [
            { id: "green-1", cssVar: "--c-green-1", label: "Sub-color 1 [Verde]", value: "#16a316", where: "Botón JUGAR" },
            { id: "green-2", cssVar: "--c-green-2", label: "Sub-color 2 [Verde claro]", value: "#1dbd1d", where: "Hover de JUGAR" },
            { id: "green-3", cssVar: "--c-green-3", label: "Sub-color 3 [Verde apagado]", value: "#8fc98f", where: "JUGAR deshabilitado" },
            { id: "green-4", cssVar: "--c-green-4", label: "Sub-color 4 [Verde éxito]", value: "#a8d08a", where: "Avisos de éxito y chips" },
            { id: "green-5", cssVar: "--c-green-5", label: "Sub-color 5 [Verde badge]", value: "#3d9a44", where: "Badges de estado positivo" },
            { id: "green-6", cssVar: "--c-green-6", label: "Sub-color 6 [Verde oscuro]", value: "#2d5a2d", where: "Fondo de badges de lanzamiento" }
        ]
    },
    {
        id: "rojo",
        label: "Color 6 [Rojo]",
        entries: [
            { id: "red-1", cssVar: "--c-red-1", label: "Sub-color 1 [Rojo]", value: "#b32d2d", where: "Badge de descargas y peligro" },
            { id: "red-2", cssVar: "--c-red-2", label: "Sub-color 2 [Rojo claro]", value: "#e07878", where: "Mensajes de error" },
            { id: "red-3", cssVar: "--c-red-3", label: "Sub-color 3 [Rojo brillante]", value: "#ff5a5a", where: "Acciones destructivas" },
            { id: "red-4", cssVar: "--c-red-4", label: "Sub-color 4 [Rojo profundo]", value: "#8b0015", where: "Badge de instalado" },
            { id: "red-5", cssVar: "--c-red-5", label: "Sub-color 5 [Rojo oscuro]", value: "#7a2020", where: "Fondo de badges rojos" }
        ]
    }
];

const COLOR_DEFAULTS = {};
for (const group of COLOR_GROUPS) {
    for (const entry of group.entries) {
        COLOR_DEFAULTS[entry.cssVar] = entry.value;
    }
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

export { COLOR_GROUPS, COLOR_DEFAULTS, parseColorOverrides, parseGradient, GRADIENT_DEFAULT };
