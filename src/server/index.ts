import { createApp } from './app.js';

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`[LeadPulse Sentinel Server] Active and listening on http://localhost:${port}`);
});
