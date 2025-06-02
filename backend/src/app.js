import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import authRoute from "./routes/auth.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

const prefix = "/api/v1/";
app.use("/api/v1/auth", authRoute);

app.use(errorHandler);

export { app };
