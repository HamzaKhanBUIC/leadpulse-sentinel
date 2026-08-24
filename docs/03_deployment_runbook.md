# LeadPulse Deployment Runbook

## 1. Production Deployment (Node.js / PM2 / Docker)

### Option A: Standalone Node.js / Systemd
```bash
# Set environment variables
export PORT=3001
export NODE_ENV=production

# Start with PM2 process manager
pm2 start src/server/index.js --name leadpulse-sentinel
```

### Option B: Docker Container
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY . .
EXPOSE 3001
CMD ["node", "src/server/index.js"]
```

---

## 2. Inbound Webhook Configuration
To connect live telecommunication lines or website forms:
- **Missed Calls**: Point your Twilio/CallRail webhook URL to:  
  `https://your-domain.com/api/v1/leads/ingest`
- **Web Forms**: Submit form payloads with `channel: "WEB_FORM"`, `customer_name`, `customer_phone`, and `raw_inquiry_text`.
