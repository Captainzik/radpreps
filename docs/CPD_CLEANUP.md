# CPD Attempts Cleanup Job

This document explains how to schedule and run the automated cleanup job for old unfinished CPD attempts.

## Overview

The cleanup job removes CPD (Continuing Professional Development) attempts that are:
- Incomplete (`completed: false`)
- Created or started 24+ hours ago

This prevents database bloat since CPD attempts are not meant to be resumed.

## API Endpoint

**URL:** `POST /api/cleanup/cpd-attempts`

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed",
  "deletedCount": 5,
  "totalFound": 5
}
```

## Security

**IMPORTANT:** Before deploying to production, add authentication to the cleanup endpoint.

Uncomment and implement the authentication check in `/app/api/cleanup/cpd-attempts/route.ts`:

```typescript
const apiKey = req.headers.get('x-api-key')
if (apiKey !== process.env.CLEANUP_API_KEY) {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}
```

Then add `CLEANUP_API_KEY` to your environment variables.

## Scheduling Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cleanup/cpd-attempts",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs the cleanup daily at 2:00 AM UTC.

2. Deploy to Vercel - cron jobs are automatically configured

**Note:** Vercel Cron is only available on Pro and Enterprise plans.

### Option 2: External Cron Service (Works anywhere)

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions**

Example GitHub Actions workflow (`.github/workflows/cleanup-cpd.yml`):

```yaml
name: Cleanup Old CPD Attempts

on:
  schedule:
    # Run daily at 2:00 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: |
          curl -X POST https://your-domain.com/api/cleanup/cpd-attempts \
            -H "x-api-key: ${{ secrets.CLEANUP_API_KEY }}" \
            -H "Content-Type: application/json"
```

Add `CLEANUP_API_KEY` to your GitHub repository secrets.

### Option 3: Self-hosted Cron (Linux/Unix servers)

1. Create a script `scripts/cleanup-cpd.sh`:

```bash
#!/bin/bash
curl -X POST https://your-domain.com/api/cleanup/cpd-attempts \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

2. Make it executable:
```bash
chmod +x scripts/cleanup-cpd.sh
```

3. Add to crontab:
```bash
crontab -e
```

Add this line to run daily at 2:00 AM:
```
0 2 * * * /path/to/your/project/scripts/cleanup-cpd.sh >> /var/log/cpd-cleanup.log 2>&1
```

### Option 4: Node.js Scheduled Job (If you have a long-running server)

Install `node-cron`:
```bash
npm install node-cron
```

Create `scripts/cleanup-scheduler.ts`:

```typescript
import cron from 'node-cron'

// Run daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running CPD cleanup job...')

  try {
    const response = await fetch('http://localhost:3000/api/cleanup/cpd-attempts', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLEANUP_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('Cleanup result:', data)
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
})

console.log('CPD cleanup scheduler started')
```

## Manual Testing

You can manually trigger the cleanup job for testing:

```bash
curl -X POST http://localhost:3000/api/cleanup/cpd-attempts \
  -H "Content-Type: application/json"
```

Or with authentication (once implemented):

```bash
curl -X POST http://localhost:3000/api/cleanup/cpd-attempts \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json"
```

## Monitoring

The endpoint returns detailed information about the cleanup operation:
- `deletedCount`: Number of attempts successfully deleted
- `totalFound`: Total number of old attempts found
- `errors`: Array of error messages if any deletions failed

Consider logging this information for monitoring purposes.

## Recommended Schedule

- **Daily at 2:00 AM UTC** - Recommended for most applications
- **Twice daily** - If you have high CPD attempt volume
- **Weekly** - If you have low CPD attempt volume

Adjust based on your application's usage patterns.
