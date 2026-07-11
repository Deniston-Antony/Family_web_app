import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeSocket, setIO } from "./socket";

const dev = process.env.NODE_ENV !== "production";
// Render/K8s set HOSTNAME to the pod name — always bind 0.0.0.0 so the load balancer can reach us
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = initializeSocket(server);
  setIO(io);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO ready on ws://${hostname}:${port}/api/socketio`);
  });
});
