import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { CreateServer } from "./lib/socket-io.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: "*" }));
app.use(express.static("public"));
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ success: true, message: "Server is Healthy!" });
});

const httpServer = createServer(app);
export const io = CreateServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
