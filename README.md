# QEC Assessment System

Full-stack university Quality Enhancement Cell (QEC) Assessment Team Evaluation System based on Standards 1 to 7 with ratings, scoring, and admin analytics.

## Stack

- Frontend: React + Vite + CSS + Chart.js
- Backend: Node.js + Express
- Database: Local JSON file store (`backend/data/responses.json`)

## Features Implemented

- Assessment Team Evaluation form UI with professional layout
- Standards 1 to 7 sections and rubric-style 1-5 ratings (radio buttons)
- Required evaluator fields:
  - evaluatorName
  - institutionName
  - programName
  - date
- Required observations/findings textarea
- Validation: all standard questions and required fields must be completed
- Submit success message with overall score
- Duplicate prevention (same evaluator + institution + program + date)
- REST API:
  - `POST /api/submit`
  - `POST /api/admin/login`
  - `GET /api/responses` (admin-protected)
- Admin dashboard:
  - admin login (restricted access)
  - table of submissions
  - click any evaluator row to view that person-only details
  - filter by evaluator and date range
  - average per standard + overall average
  - bar chart for S1-S7
  - pie chart for rating distribution
  - observations list
- Scoring logic:
  - per-standard totals
  - normalized percentages
  - weighted standard scores
  - overall assessment score

## Project Structure

```text
.
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── smoke-test.mjs
│   └── src/
│       ├── server.js
│       ├── config/assessmentConfig.js
│       ├── models/AssessmentResponse.js
│       ├── routes/responses.js
│       ├── utils/scoring.js
│       └── validators/submissionValidator.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── styles.css
│       ├── components/
│       │   ├── AdminDashboard.jsx
│       │   ├── QuestionBlock.jsx
│       │   └── StandardSection.jsx
│       └── data/defaultStandards.js
└── package.json
```

## Data Schema (Local Store)

File: `backend/data/responses.json`

Each response stores:

- `evaluatorName: String`
- `institutionName: String`
- `programName: String`
- `date: Date`
- `standard1: Number[]`
- `standard2: Number[]`
- `standard3: Number[]`
- `standard4: Number[]`
- `standard5: Number[]`
- `standard6: Number[]`
- `standard7: Number[]`
- `observations: String`
- `standardScores: object`
- `overallScore: Number`
- `createdAt: Date`

Duplicate prevention key:

- `evaluatorName + institutionName + programName + date`

## API Routes

### `POST /api/submit`

Request JSON:

```json
{
  "evaluatorName": "Dr. A",
  "institutionName": "FAST Peshawar",
  "programName": "BS Artificial Intelligence",
  "date": "2026-04-14",
  "standard1": [4, 4, 5, 4, 4, 5, 4, 4],
  "standard2": [4, 4, 4, 5, 4, 4, 4],
  "standard3": [4, 4, 4, 4],
  "standard4": [4, 4, 4],
  "standard5": [4, 4, 4, 4, 4, 4, 4, 4],
  "standard6": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  "standard7": [4, 4, 4, 4, 4, 4],
  "observations": "Assessment observations"
}
```

### `GET /api/responses?evaluator=&from=&to=`

Requires header:

`Authorization: Bearer <admin_token>`

Returns:

- `responses`
- `averageScores`
- `ratingDistribution`
- `observations`

## Run Instructions (Step by Step)

1. Install root dependency (`concurrently`):

```bash
npm.cmd install
```

2. Install backend and frontend dependencies:

```bash
cd backend
npm.cmd install
cd ../frontend
npm.cmd install
cd ..
```

3. Start both apps (dev):

```bash
npm.cmd run dev
```

4. Open frontend:

- `http://localhost:5175`

5. Backend health endpoint:

- `http://localhost:5001/health`

## Admin Credentials

Create `backend/.env` from `backend/.env.example` and set:

```env
PORT=5001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

You can change these values before delivery.

## Smoke Test Runner

With backend running, run:

```bash
cd backend
node smoke-test.mjs
```

This script posts a sample submission and verifies `/api/responses`.
