import { serve } from "@hono/node-server";
import api from "./router.js";
import { welcome } from "./welcome.js";

const port = process.env.PORT || 3000;

welcome(Number(port));

serve({
    fetch: api.fetch,
    port: Number(port),
});
