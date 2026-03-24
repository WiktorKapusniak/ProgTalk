# ProgTalk

ProgTalk is a full-stack discussion platform for developers, designed around moderated technical communities.
It combines a hierarchical topic system, role-based access control, and real-time updates for topics, subtopics, and posts.

## Why this project stands out

- **Real-time collaboration** with Socket.IO for live topic/post updates.
- **Role-based moderation model** (user, moderator, main moderator, admin).
- **Structured discussion tree** using topics and nested subtopics.
- **Production-style backend setup** with JWT auth, MongoDB, HTTPS server, and Dockerized build.
- **Strong portfolio value**: full-stack architecture, API design, auth, moderation workflows, and reactive UI.

## Core Features

### Authentication & Access

- User registration and login with JWT-based authentication.
- Admin approval flow for newly registered users.
- Ban/unban support with automatic access restriction.
- Route guards on frontend based on auth + approval status.

### Forum & Discussion

- Create and browse top-level topics.
- Create nested subtopics under existing topics.
- Create, edit, delete (soft delete) posts.
- Reply-to-post flow (threaded replies).
- Like/unlike posts.
- Pagination for topics and posts.
- Code snippets in posts with syntax highlighting (`highlight.js`).

### Moderation & Administration

- Main moderator can edit own topics.
- Moderator management per topic (add/remove moderators).
- Block/unblock users in a topic (with propagation to subtopics).
- Topic visibility control (`hide` / `unhide`).
- Topic state control (`open` / `close`).
- Admin panel for:
	- approving users,
	- viewing banned users,
	- creating tags.

### Real-Time Events (Socket.IO)

- New topic broadcast (`newTopic`).
- New subtopic broadcast (`newSubtopic`).
- New post broadcast (`newPost`).
- Post reaction updates (`postLiked`, `postUnliked`).
- Post deletion updates (`post-deleted`).
- Admin notifications for registration/approval events.

## Tech Stack

### Frontend

- Vue 3 + TypeScript
- Vue Router
- Axios
- Socket.IO Client
- SCSS
- Vue Toastification
- Vite

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Passport JWT
- Socket.IO
- bcrypt

### DevOps / Runtime

- Docker multi-stage build
- Docker Compose
- HTTPS certificates (mounted into backend container)

## Architecture Overview

```text
Client (Vue + Vite)
	 |  HTTP (JWT Bearer)
	 v
Express API + Passport JWT + Mongoose
	 |\
	 | \-- Socket.IO (authenticated events)
	 |
	 +---- MongoDB
```

## Project Structure

```text
ProgTalk/
├── backend/                 # Express API, auth, models, routes, sockets
├── frontend/                # Vue 3 SPA
├── nginx/                   # Nginx config + TLS certs
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ (22 also works for frontend)
- npm
- MongoDB (local or remote)
- TLS certificate files for backend HTTPS:
	- `backend/certs/nginx.crt`
	- `backend/certs/nginx.key`

### Environment Variables (`backend/.env`)

```env
MONGO_URI=mongodb://localhost:27017/progtalk
JWT_SECRET=your_super_secret_key
PORT=5000
```

## Run with Docker (recommended)

From repository root:

```bash
docker compose up --build
```

What this does:

- starts MongoDB,
- builds frontend and embeds it into backend `public/`,
- starts backend server with HTTPS and API.

> Note: `docker-compose.yml` expects `backend/.env` and mounts certificates from `nginx/certs`.

## Run Locally (without Docker)

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

> Important: backend uses an HTTPS server in `backend/src/index.js`. If you run backend locally, make sure cert paths and Vite proxy target are aligned with your local protocol/port configuration.

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users/:id`
- `PATCH /api/users/:id`

### Topics

- `POST /api/topics`
- `GET /api/topics`
- `GET /api/topics/:id`
- `GET /api/topics/:id/subtopics`
- `PATCH /api/topics/:id`
- `POST /api/topics/:id/subtopics`
- `POST /api/topics/:id/moderators`
- `DELETE /api/topics/:id/moderators/:username`
- `POST /api/topics/:id/block-user`
- `POST /api/topics/:id/unblock-user`
- `POST /api/topics/:id/close`
- `POST /api/topics/:id/open`
- `POST /api/topics/:id/hide`
- `POST /api/topics/:id/unhide`
- `GET /api/topics/:id/blocked-users`

### Posts

- `GET /api/topics/:topicId/posts`
- `POST /api/topics/:topicId/posts`
- `GET /api/posts/replies`
- `GET /api/posts/:postId`
- `PATCH /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `POST /api/posts/:id/like`
- `DELETE /api/posts/:id/like`

### Admin / Admin Panel

- `POST /api/admin/ban/:username`
- `POST /api/admin/unban/:username`
- `GET /api/admin-panel/users/pending-approval`
- `GET /api/admin-panel/users/banned`
- `POST /api/admin-panel/users/:id/approve`

### Tags

- `POST /api/tags`
- `GET /api/tags`

## Data Model Highlights

- **User**: username, email, hashed password, role, banned, approved.
- **Topic**: title, description, hierarchy (`parentTopic`), moderators, blocked users, visibility/state flags.
- **Post**: author, topic, content, optional code, tags, reply reference, likes, soft-delete flag.
- **Tag**: unique tag names.

## What I would improve next

- Add automated tests (unit + integration + e2e).
- Add API documentation (OpenAPI/Swagger).
- Add CI pipeline (lint/test/build).
- Improve i18n consistency (currently mixed EN/PL in UI messages).
- Add rate limiting and stronger input sanitization.

## Author

Built as a full-stack portfolio project focused on backend architecture, moderation workflows, and real-time forum interactions.
