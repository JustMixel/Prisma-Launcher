import sql from "mssql/msnodesqlv8.js";
import config from "./config.js";

export async function connectDB() {
    try {
        const pool = await sql.connect(config);

        console.log("Conexión exitosa a SQL Server");
        console.log(`Base de datos: ${config.database}`);

        return pool;
    } catch (error) {
        console.error("Error al conectar con SQL Server:", error.message);
        throw error;
    }
}