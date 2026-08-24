import { createHttpServer } from './nativeServer.js';

const port = process.env.PORT || 3001;
const server = createHttpServer();

server.listen(port, () => {
  console.log(`[LeadPulse Sentinel Server] Active and listening on http://localhost:${port}`);
});
