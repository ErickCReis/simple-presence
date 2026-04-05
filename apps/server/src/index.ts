import { showRoutes } from "hono/dev";
import { api } from "./api";
import { Hono } from "hono";

const app = new Hono().route("/api", api);

showRoutes(app);

export default app;
export { Presence } from "./durable-objects/presence";
