import { serve } from "@hono/node-server";
import api from "./router.js";

const port = process.env.PORT || 3000;

console.log(`サーバーを起動します: http://localhost:${port}`);

serve({
    fetch: api.fetch,
    port: Number(port),
});
