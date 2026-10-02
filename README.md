# ⚡ ZYOSEE — Online Judge
<p align="center">
  <strong>Practice. Compile. Compete. Improve.</strong>
</p>
<p align="center">
  A full-stack competitive programming platform built around online judging,
  isolated code execution, asynchronous submissions, collaborative coding,
  competitive duels, progress tracking, and AI-assisted learning.
</p>
<p align="center">
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Queue%20%26%20Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Sandbox-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
</p>
---
## ✦ About ZYOSEE
**ZYOSEE** is a full-stack Online Judge and competitive programming platform designed to bring problem solving, code execution, collaboration, competition, and AI-assisted learning into one system.
The platform separates **account management**, **code execution**, **problem management**, **AI services**, and **judge workers** so that expensive or potentially unsafe workloads do not interfere with core application services.
The architecture is designed with scalability and fault isolation in mind, allowing the judge layer to grow independently from the web application.
---
## ✨ Highlights
| | Feature | Description |
|---|---|---|
| 🔐 | **Authentication** | JWT-based user authentication and authorization |
| 💻 | **Online Compiler** | Compile and execute C, C++, Python and Java |
| 🧪 | **Online Judge** | Hidden-test based code evaluation |
| 🐳 | **Docker Execution** | Isolated execution environment for submitted programs |
| ⚡ | **Async Submissions** | Redis-backed submission queue |
| 👷 | **Judge Workers** | Multiple workers can process submissions concurrently |
| 🤖 | **AI Coding Assistant** | Gemini-powered debugging and learning assistance |
| 🧠 | **Complexity Analysis** | AI-based best, average and worst-case analysis |
| 🚦 | **AI Rate Limiting** | Per-user cooldowns, quotas, locks and caching |
| 🤝 | **Pair Lab** | Collaborative problem solving |
| ⚔️ | **Duel Arena** | Timed competitive coding matches |
| 📊 | **Progress** | Submission-based progress and statistics |
| 📝 | **Drafts** | Per-user, per-problem local code drafts |
| 🛡️ | **Authorization** | Server-side permission enforcement |
| 📦 | **Problem Management** | MongoDB-backed problem creation and management |
| 🔄 | **Graceful Degradation** | Redis and AI failures do not bring down judging |
---
# 🏗️ System Architecture
```text
                                  ┌──────────────────────┐
                                  │      React/Vite      │
                                  │      Frontend        │
                                  │       :5173          │
                                  └──────────┬───────────┘
                                             │
                                  REST / WebSocket
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
            ┌─────────────────────┐                   ┌─────────────────────┐
            │    Accounts API     │                   │   Compiler / Judge  │
            │        :5001        │                   │        :8000         │
            │                     │                   │                      │
            │ • Authentication    │                   │ • Compile           │
            │ • JWT               │                   │ • Execute           │
            │ • User CRUD         │                   │ • Judge             │
            │ • Authorization     │                   │ • AI Analysis       │
            └──────────┬──────────┘                   └──────────┬───────────┘
                       │                                         │
                       ▼                                         ▼
                ┌──────────────┐                         ┌──────────────┐
                │   MongoDB    │                         │    Redis     │
                │              │                         │              │
                │ • Users      │                         │ • Queue      │
                │ • Problems   │                         │ • AI Limits  │
                │ • Metadata   │                         │ • AI Cache   │
                └──────────────┘                         └──────┬───────┘
                                                                │
                                                                ▼
                                                      ┌──────────────────┐
                                                      │  Judge Workers   │
                                                      │                  │
                                                      │ Worker 1         │
                                                      │ Worker 2         │
                                                      │ Worker N         │
                                                      └────────┬─────────┘
                                                               │
                                                               ▼
                                                      ┌──────────────────┐
                                                      │ Docker Sandbox   │
                                                      │                  │
                                                      │ C / C++ / Python │
                                                      │ Java             │
                                                      └──────────────────┘

⸻

📁 Project Structure

ZYOSEE/
│
├── backend/
│   ├── Accounts API
│   ├── JWT authentication
│   ├── User management
│   └── MongoDB
│
├── compiler/
│   ├── Compile / Run / Judge
│   ├── AI analysis
│   ├── Redis integration
│   ├── Judge workers
│   └── problems/
│
├── frontend/
│   ├── Vite
│   ├── React
│   └── Tailwind CSS
│
├── scripts/
│   ├── Test generation
│   └── Problem migration
│
└── README.md

⸻

🧩 Service Architecture

Service	Port	Responsibility
Frontend	5173	React user interface
Backend	5001	Accounts, authentication and authorization
Compiler	8000	Compilation, execution, judging and AI
Redis	6379	Submission queue, cache and rate limiting
MongoDB	—	Persistent application data

⸻

🚀 Getting Started

1. Clone the repository

git clone <your-repository-url>
cd ZYOSEE

2. Configure environment variables

Each service contains an environment template.

cp backend/.env.sample backend/.env
cp compiler/.env.sample compiler/.env
cp frontend/.env.sample frontend/.env

Important Configuration

The JWT secret must be identical in both services.

# backend/.env
JWT_SECRET_KEY=your-secret
# compiler/.env
JWT_SECRET_KEY=your-secret

Important: JWT_SECRET_KEY must be byte-identical in both services.

Also ensure:

DB_NAME=your_database

matches the database specified at the end of:

MONGODB_URI=...

⸻

▶️ Running Locally

Open three terminals.

Backend

cd backend
npm install
npm run dev

Runs on:

http://localhost:5001

Compiler

cd compiler
npm install
npm run dev

Runs on:

http://localhost:8000

Frontend

cd frontend
npm install
npm run dev

Runs on:

http://localhost:5173

⸻

🔐 Authentication

ZYOSEE uses JWT-based authentication.

Accounts API

Method	Route	Auth	Purpose
POST	/signup	❌	Create account
POST	/login	❌	Login
GET	/me	✅	Get current user
GET	/users	❌	List users
GET	/users/:id	❌	Get a user
PUT	/users/:id	✅	Update own account
DELETE	/users/:id	✅	Delete own account

Protected routes use:

Authorization: Bearer <token>

Tokens expire after one hour by default.

⸻

🔄 Token Expiration Handling

ZYOSEE handles expired sessions at multiple levels.

1. Token validation on page load

A stored token is checked before being used.

2. Automatic expiration timer

A timer fires exactly when the token expires.

3. Server-side rejection

Any:

401 Unauthorized
403 Forbidden

response clears the current session.

This also handles cases where the server rejects an otherwise locally valid token, such as after a JWT secret change.

⸻

💻 Online Compiler

ZYOSEE supports:

C
C++
Python
Java

Run API

POST /run

Request

{
  "language": "cpp",
  "code": "#include <iostream>\n...",
  "input": "10 20"
}

Verdicts

Verdict	Meaning
success	Program exited successfully
compilation_error	Compilation failed
runtime_error	Program crashed or exited abnormally
time_limit_exceeded	Execution exceeded the configured limit
output_limit_exceeded	Program exceeded the output limit

Compilation and execution times are returned independently.

{
  "compileMs": 280,
  "runMs": 8
}

This prevents compiler startup time from being mistaken for program execution time.

⸻

🧪 Online Judge

The official judging pipeline:

                    ┌──────────────┐
                    │    Submit    │
                    └──────┬───────┘
                           │
                           ▼
                    POST /submit
                           │
                           ▼
                     Create Job
                           │
                           ▼
                    Redis Queue
                           │
                           ▼
                    Judge Worker
                           │
                           ▼
                     Compile Code
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
           Test 1                    Test N
              │                         │
              ▼                         ▼
        Compare Output            Compare Output
              │                         │
              └────────────┬────────────┘
                           ▼
                        Verdict

⸻

Submission API

POST /submit

Request

{
  "slug": "two-sum",
  "language": "cpp",
  "code": "..."
}

Queued Response

{
  "jobId": "abc123",
  "status": "queued",
  "waitingAhead": 2
}

The browser can then poll:

GET /submit/:jobId

Job States

queued
running
done
failed

⸻

⚡ Why a Submission Queue?

Without a queue, every submission would immediately consume compiler and CPU resources.

20 Users
   │
   ├── g++
   ├── g++
   ├── g++
   ├── g++
   ├── ...
   └── ...

With Redis:

Users
  │
  ▼
API
  │
  ▼
Redis Queue
  │
  ├──────── Worker 1
  ├──────── Worker 2
  ├──────── Worker 3
  └──────── Worker N

The number of simultaneous compilation jobs is controlled by the number of judge workers.

Workers can be scaled independently:

docker compose up -d --scale worker=3

⸻

📊 Queue Performance

A concurrency experiment using brute-force submissions:

Workers	First Accepted	All Jobs Completed
1	~618 ms	~38.0 s
3	~613 ms	~16.5 s

The first accepted submission remains almost unchanged because accepting a submission is primarily a queue operation.

Increasing worker count reduces the total time required to process the queue.

⸻

📍 Queue Position

The submission queue is stored in:

oj:judge:queue

Jobs are inserted and consumed using:

LPUSH → queue
BRPOP → worker

LPOS is used to determine how many submissions are ahead of the current job.

⸻

🧠 Judge Correctness

A submission is marked Accepted only when:

passed === total

The judge does not consider a submission accepted merely because no test has explicitly failed.

This prevents incomplete judging from being incorrectly reported as success.

Verdicts

accepted
wrong_answer
compilation_error
runtime_error
time_limit_exceeded
output_limit_exceeded

Example:

Tests
✓ Test 1
✓ Test 2
✓ Test 3
✗ Test 4
✓ Test 5
Result → Wrong Answer

⸻

🧪 Test Case System

Problems follow this structure:

problem/
│
├── problem.json
│
└── tests/
    ├── 1.in
    ├── 1.out
    ├── 2.in
    ├── 2.out
    └── ...

The first two tests are samples.

The remaining tests are hidden.

                    Browser
                       │
                 ┌─────┴─────┐
                 ▼           ▼
             Sample 1    Sample 2
                    Server
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
         Hidden 3   Hidden 4   Hidden N

Hidden inputs and expected outputs never reach the client.

⸻

🔒 Output Comparison

The judge performs normalized output comparison.

It:

* removes trailing whitespace
* removes blank lines from the end
* preserves spacing inside lines
* compares the resulting output

This avoids rejecting correct programs because of formatting differences such as a missing final newline.

⸻

🧩 Custom Test Cases

ZYOSEE intentionally separates debugging from official judging.

Debugging

POST /run-batch

Example:

{
  "slug": "two-sum",
  "language": "cpp",
  "code": "...",
  "cases": [
    {
      "input": "2 7",
      "expected": "9"
    }
  ]
}

Custom cases:

* compile once
* execute multiple times
* optionally compare expected output
* never produce an official verdict

Official Submission

POST /submit

Uses:

Problem's own hidden test suite

This prevents a user from receiving Accepted simply because their own custom cases passed.

⸻

🐳 Docker Execution

The compiler and judge run inside a Docker environment.

┌──────────────────────────────────────────────┐
│                Docker Container              │
│                                              │
│  Compiler / Judge Service                    │
│  ├── Node.js                                 │
│  ├── g++                                     │
│  ├── Python                                  │
│  └── Java                                    │
│                                              │
│  Submitted Program                           │
│            │                                 │
│            ▼                                 │
│       Compile / Run                          │
│                                              │
└──────────────────────────────────────────────┘

Build

cd compiler
npm run docker:build

Start

npm run docker:start

Logs

npm run docker:logs

Stop

npm run docker:stop

⸻

📦 Runtime Problem Mounting

Problems are mounted separately from the Docker image:

-v "$(pwd)/problems:/app/problems:ro"

The image contains the execution engine.

The mounted directory contains the problem content.

Docker Image
│
├── Compiler
├── Judge
└── Runtime
Runtime Mount
│
└── problems/
    ├── statements
    ├── samples
    └── hidden tests

Why?

* No image rebuild for every new problem
* Problem content can change independently
* Hidden tests are not baked into the published image
* Read-only mounting prevents submitted programs from modifying test data

⸻

🛡️ Sandbox Model

The current Docker architecture provides:

* isolated filesystem
* unprivileged execution
* separation from the main application
* read-only problem files

However, it is not yet a fully hardened public-production sandbox.

Current limitations

* Network access is still available
* Memory limits are not yet enforced
* Process limits are not yet enforced
* Multiple submissions share the service container
* Execution is not yet isolated into a new container per submission

Planned Hardened Execution

Submission
    │
    ▼
Ephemeral Container
    │
    ├── --network none
    ├── --memory
    ├── --pids-limit
    ├── read-only filesystem
    ├── CPU limit
    └── unprivileged user

This model is intended for future public deployment where arbitrary user code must be treated as untrusted.

⸻

🗄️ Database Architecture

MongoDB stores persistent application data.

MongoDB
│
├── Users
│
├── Problems
│   ├── Statement
│   ├── Constraints
│   ├── Examples
│   ├── Reference Solution
│   ├── Generator Specification
│   └── Test Manifest
│
└── Future
    └── Submissions

Actual test files are stored separately on disk.

Why?

A problem can contain several megabytes of test data, while MongoDB documents have a 16 MB document limit.

Therefore:

MongoDB
└── Problem metadata + test manifest
Disk
└── Actual .in / .out files

⸻

🔄 Problem Management

Problems are created through the Add Problem interface.

Only accounts included in:

ADMIN_EMAILS=you@example.com

can access admin APIs.

The authorization check is performed on the server for every protected admin route.

Frontend visibility is not treated as a security mechanism.

⸻

🧪 Reference Solutions

Every problem requires a trusted reference solution.

Input Generator
       │
       ▼
Generated Input
       │
       ▼
Reference Solution
       │
       ▼
Expected Output

The reference solution defines the expected output for generated and curated inputs.

This eliminates the need to manually write expected outputs for large generated test suites.

⸻

🧰 Test Generation

Tests can be generated using:

node scripts/generate-tests.js

The generator is deterministic.

The same seed produces:

same inputs
same outputs
same files

Curated Tests

Used for cases such as:

* minimum values
* maximum values
* duplicates
* negative values
* overflow risks
* special edge cases

Generated Tests

Automatically produced cases grow toward the problem’s maximum constraints.

This helps expose inefficient algorithms that pass small examples but fail at scale.

⸻

📐 Input Generator

Supported field types:

Type	Description
Single Integer	Integer within a specified range
Integer Array	Array with configurable length
Sum of K Values	Generates a reachable target

Example:

n = 5
a = [1, 4, 7, 9, 12]
target = 13

The target can be generated from actual array elements rather than being randomly selected.

⸻

⏱️ Language-Specific Time Limits

The judge applies language multipliers.

Language	Multiplier
C	1×
C++	1×
Java	2×
Python	3×

This provides reasonable execution budgets across compiled and interpreted languages.

⸻

📤 Output Limits

Output limits are calculated from the reference solution.

Maximum Reference Output
           │
           ▼
          × 2
           │
           ▼
      Problem Limit

The configured limits are:

Minimum → 64 KB
Maximum → 8 MB

The same limit is used for both:

Reference Solution
       ↓
User Submission

This ensures that a correct reference solution can never produce output that the actual judge would reject.

⸻

⚡ Redis Architecture

Redis powers two independent parts of ZYOSEE:

Redis
│
├── AI Protection
│   ├── Rate Limiting
│   ├── Cooldown
│   ├── Concurrent Request Lock
│   └── Response Cache
│
└── Judge
    ├── Submission Queue
    └── Job State

Redis is therefore used for both fast temporary state and asynchronous job processing.

⸻

🤖 AI Rate Limiting

Every AI request passes through multiple server-side controls.

Request
   │
   ▼
Concurrent Lock
   │
   ▼
Cache
   │
   ▼
Cooldown
   │
   ▼
Hourly / Daily Quota
   │
   ▼
Gemini

Default Configuration

Setting	Default
Requests / hour	10
Requests / day	30
Cooldown	5 sec
Cache TTL	30 min
Normal output	700 tokens
Full solution output	1600 tokens
Maximum code	8000 chars

⸻

🔑 Redis Keys

Key	Type	Purpose
oj:ai:hist:<userId>	Sorted Set	Sliding-window quota
oj:ai:lock:<userId>	String	One active request
oj:ai:ans:<sha256>	String	Cached AI response
oj:judge:queue	List	Submission queue
oj:judge:job:<id>	String	Job state and verdict

⸻

🔐 Atomic AI Lock

The AI concurrency lock uses:

SET key value NX EX 60

NX ensures only one request can claim the slot.

The expiration ensures a crashed request cannot permanently lock a user.

Request A ──► SET NX ──► SUCCESS
Request B ──► SET NX ──► FAIL

The second request receives:

429 Too Many Requests

⸻

📴 Redis Failure Handling

If Redis becomes unavailable, the system falls back to in-memory storage.

              Redis Available
                    │
                    ▼
                Redis Mode
              Redis Unavailable
                    │
                    ▼
                Memory Mode

The application does not indefinitely wait for Redis to reconnect.

This prevents a degraded Redis connection from turning an optional infrastructure failure into a permanently hanging request.

⸻

🤖 AI Coding Assistant

The AI system is deliberately independent of the judge.

Judge
  │
  ├── Accepted ───────────────► No AI
  │
  └── Failed
        │
        ▼
   AI Assistant

Available Actions

Action	Purpose
Explain Error	Explain what went wrong
Hint	Progressive guidance
Ask	Ask about the user’s code
Full Solution	Explicitly requested complete solution

Hint Ladder

Level 1 → Conceptual hint
Level 2 → Problem region
Level 3 → Specific mistake
Level 4 → Small code fragment

The AI does not receive hidden test inputs or hidden expected outputs.

⸻

🧠 AI Time Complexity Analysis

After a submission receives a verdict, the AI can analyze the submitted program and report:

Best Case
Average Case
Worst Case

The AI layer is independent of judging.

If Gemini becomes unavailable:

Judge → Continues Normally
AI    → Temporarily Unavailable

A language model failure can therefore never prevent the judge from determining correctness.

⸻

🤝 Pair Lab

Pair Lab allows two users to work together on the same coding problem.

User A
   │
   │
   ▼
┌─────────────────────────────┐
│         Pair Lab            │
│                             │
│       Shared Editor         │
│                             │
│   Cursor A      Cursor B    │
│                             │
│         Chat Panel          │
└─────────────────────────────┘
   ▲
   │
   │
User B

Features

* Shared editor
* Live cursor indicators
* Chat
* Shared problem
* Run
* Submit
* Friend-based invitations

⸻

⚔️ Duel Arena

Duel Arena transforms problem solving into a timed competition.

                    Match Lobby
                         │
                  ┌──────┴──────┐
                  ▼             ▼
               Player 1      Player 2
                  │             │
                  └──────┬──────┘
                         ▼
                    Same Problems
                         │
                         ▼
                     Same Timer
                         │
                         ▼
                       Results

Modes

Random Duel
Custom Duel
First Accepted
Best Score
Best Time
Best of 3

The server remains authoritative for match state and timing.

⸻

📝 Per-User Drafts

Editor drafts are stored locally using:

oj_draft:<userId>:<slug>:<language>

Example:

oj_draft:
    user123:
        two-sum:
            cpp

The user ID is part of the storage key so that two accounts using the same browser cannot accidentally share unfinished code.

Logout

Logging out clears browser drafts.

Token Expiration

Token expiration does not clear drafts because the same user may simply sign in again.

⸻

🧱 Starter Code

Starter templates are stored in:

frontend/src/starters.js

There are two sources:

Problem-specific Starter
          │
          ▼
Default Starter

Problem-specific starter code takes priority.

Java Requirement

Java submissions must use:

public class Main

because the judge compiles:

Main.java

and executes:

java -cp <directory> Main

⸻

🌐 API Overview

Accounts

POST   /signup
POST   /login
GET    /me
GET    /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id

Compiler

POST /run
POST /run-batch
POST /submit
GET  /submit/:jobId

Problems

GET /problems
GET /problems/:slug

Administration

POST /admin/problems
...

⸻

📈 Scalability

One of the core design principles of ZYOSEE is:

API Scalability
      ≠
Judge Scalability

The web layer and CPU-heavy execution layer can scale independently.

Current Architecture

             API
              │
              ▼
         Redis Queue
              │
        ┌─────┴─────┐
        ▼           ▼
     Worker       Worker

Scaled Architecture

                     Load Balancer
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           API #1        API #2       API #3
              │            │            │
              └────────────┼────────────┘
                           ▼
                      Redis Cluster
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
             Worker      Worker      Worker
                │          │          │
                └──────────┼──────────┘
                           ▼
                    Execution Layer

This allows additional judge workers to be added without scaling the rest of the application.

⸻

🧯 Failure Handling

ZYOSEE is designed to degrade gracefully when optional infrastructure fails.

Failure	Behaviour
Redis unavailable	In-memory fallback
Gemini unavailable	Judge continues
Gemini quota exhausted	AI unavailable, judging unaffected
Token expired	Session cleared
MongoDB unavailable	Requests fail after timeout
Worker unavailable	Pending queue jobs remain available
Problem directory missing	Compiler can operate without problems
AI cache unavailable	New AI request can proceed

⸻

🌐 MongoDB Resilience

MongoDB connection handling includes:

* Connection retry
* Explicit connection timeout
* Safe client initialization
* DNS/SRV failure handling
* Recovery after failed connection attempts
* Protection against unhandled background connection errors

Configured server-selection timeout:

MONGO_SERVER_SELECTION_TIMEOUT_MS=8000

This prevents a database outage from making the entire application appear permanently frozen.

⸻

🔒 Security Principles

Secrets Stay Outside Images

.env
 │
 └── Runtime configuration
.dockerignore
 │
 └── Prevents secrets from entering image layers

Hidden Tests Stay Server-Side

Browser
 └── Samples
Server
 └── Hidden Tests

Authorization Is Server-Side

The frontend controls:

Visibility

The backend controls:

Permission

AI Limits Are Server-Side

Frontend buttons are UX controls, not security controls.

All AI limits are enforced on the server.

⸻

⚠️ Current Limitations

ZYOSEE is currently designed as a strong development and educational Online Judge architecture rather than a fully hardened public execution platform.

Known limitations

* Public arbitrary-code execution requires stronger sandboxing
* Current Docker execution shares the service container
* Network access is not completely disabled
* Process limits are not yet enforced
* Memory limits are not yet enforced
* Submission history is not yet persisted
* Redis currently acts as the queue rather than a distributed queue cluster
* Pair Lab requires further conflict-resolution hardening for very large deployments

These limitations are explicitly identified so the architecture can evolve safely rather than hiding production constraints.

⸻

🛣️ Roadmap

Phase 1 — Core Platform

* Authentication
* User management
* Online compiler
* C / C++ / Python / Java
* Problem management
* Test-case judging
* Hidden tests
* Docker execution
* Redis queue
* Scalable workers

Phase 2 — Competitive Platform

* Pair Lab
* Duel Arena
* Progress tracking
* Submission history
* Leaderboards
* Ratings
* Contest system

Phase 3 — Production Execution

* One container per submission
* --network none
* CPU limits
* Memory limits
* PID limits
* Read-only root filesystem
* Ephemeral execution environments
* Worker health monitoring
* Automatic failed-job recovery

Phase 4 — Scale

* Load balancer
* Multiple API instances
* Dedicated judge cluster
* Redis HA
* MongoDB replica set
* Metrics & observability
* Distributed tracing
* Centralized logging

⸻

🧪 Development Utilities

Generate Test Cases

node scripts/generate-tests.js

Migrate Existing Problems

node scripts/migrate-problems-to-mongo.js

Build Compiler Image

cd compiler
npm run docker:build

Start Services

npm run docker:start

View Logs

npm run docker:logs

Redis CLI

npm run redis:cli

Stop Services

npm run docker:stop

⸻

🧭 Design Principles

ZYOSEE follows a few core architectural principles:

Keep authentication away from arbitrary code execution.

Keep judging independent from AI.

Keep hidden tests away from the client.

Keep expensive execution behind a queue.

Keep secrets outside Docker images.

Make the server authoritative for permissions and competitive state.

Fail gracefully when optional infrastructure disappears.

Scale API servers and judge workers independently.

⸻

📚 Reference

The initial compiler implementation was based on:

AlgoU-Online-Compiler-main

It is used only as a reference implementation and is not wired into the current system.

⸻

🛠️ Tech Stack

Layer	Technology
Frontend	React, Vite, Tailwind CSS
Backend	Node.js
API	REST
Real-Time	WebSocket-ready architecture
Authentication	JWT
Database	MongoDB
Queue	Redis
Cache	Redis
AI	Google Gemini
Execution	Docker
Languages	C, C++, Python, Java
Package Manager	npm

⸻

🏛️ Final Architecture

                              ┌─────────────────┐
                              │      USERS      │
                              └────────┬────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │   React Frontend    │
                            │       :5173         │
                            └──────────┬──────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                         ▼                           ▼
                ┌─────────────────┐         ┌─────────────────┐
                │  Accounts API   │         │  Compiler / OJ  │
                │      :5001      │         │      :8000      │
                └────────┬────────┘         └────────┬────────┘
                         │                           │
                         ▼                           ▼
                    ┌─────────┐                 ┌─────────┐
                    │ MongoDB │                 │  Redis  │
                    └─────────┘                 └────┬────┘
                                                     │
                                   ┌─────────────────┼─────────────────┐
                                   │                 │                 │
                                   ▼                 ▼                 ▼
                              Judge Queue        AI Cache         AI Limits
                                   │
                         ┌─────────┼─────────┐
                         ▼         ▼         ▼
                      Worker 1  Worker 2  Worker N
                         │         │         │
                         └─────────┼─────────┘
                                   ▼
                            ┌──────────────┐
                            │    Docker    │
                            │   Sandbox    │
                            └──────────────┘
                                   │
                       ┌───────────┼───────────┐
                       ▼           ▼           ▼
                       C          C++      Python / Java

⸻

✦ ZYOSEE

<p align="center">

Practice. Compile. Compete. Improve.

A competitive programming platform designed around
real judging, scalable execution, collaborative coding, and AI-assisted learning.

</p>

⸻

<p align="center">
  <sub>Built with ❤️ for competitive programmers.</sub>
</p>
```
