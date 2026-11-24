import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "./db/dbConnect.js";
import router from "./Routes/launcherRoutes.js";
import creatorRouter from "./Routes/creatorRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Assets de prueba del launcher (hover de mods, portadas temporales, etc.).
app.use("/static", express.static(path.join(__dirname, "..", "src", "assets")));

app.use((req, res, next) => {
    console.log(req.method, req.originalUrl);
    next();
});

// ROUTERS
app.use("/api", router);
app.use("/api", creatorRouter);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

async function startServer() {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(
                `Servidor corriendo en puerto ${port}`
            );
        });
    } catch (error) {
        console.error(
            "No se pudo iniciar el servidor:",
            error.message
        );

        process.exitCode = 1;
    }
}

startServer();
