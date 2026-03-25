# Debug Duel Backend

> **Debug Duel** is the backend for an online programming contest / debugging game.  
> Participants submit code, solve questions, and compete on leaderboards in real time.

This service is written in **TypeScript** with **Express**, uses **Prisma** as the ORM,
and persists to a **Postgres** database.  Socket.IO provides
live updates for rounds and leaderboards.

---

## 🚀 Features

- User authentication (register/login, JWT).
- Round management (create, lock/unlock, complete, timer).
- Question & testcase CRUD.
- Submission handling & remote code execution via Piston.
- Leaderboard calculation.
- Team management (upload/download CSV).
- Admin routes for viewing submissions, buggy code, etc.
- File uploads (Multer) for bulk team import.
- Real‑time updates through WebSockets.

---

## 📦 Tech Stack

| Area            | Technology                  |
| --------------- | --------------------------- |
| Language        | TypeScript                  |
| Server          | Express                     |
| Real‑time comm. | Socket.IO                   |
| ORM             | Prisma                      |
| Database        | Postgres           |
| Auth            | bcrypt + JWT                |
| File parsing    | csv‑parser, xlsx            |
| Environment     | dotenv                      |

---

## 🛠️ Getting Started

**Clone the repo**
```bash
   git clone https://github.com/<your‑user>/debug_duel_backend.git
   cd debug_duel_backend
```

## 📦 Installation & Setup

### Install Dependencies

```bash
npm install
```

### Set Up Environment

Copy `.env.example` to `.env` and configure values such as:

* Database URL
* JWT secret
* Any other required environment variables

```bash
cp .env.example .env
```

---

## 🗄️ Database Setup

### Run Migrations & Generate Prisma Client

```bash
npx prisma migrate deploy   # or `migrate dev` as needed
npx prisma generate
```

### (Optional) Seed the Database

```bash
npm run db:seed
```

---

## 🚀 Running the App

### Start the Development Server

```bash
npm run dev
```

The API will be available at:

```
http://localhost:3000
```

(or as configured in your environment variables)

### Build for Production

```bash
npm run build
npm start
```

---

## 🗂️ Database Details

* Prisma schema: `schema.prisma`
* Migrations: `migrations/`
* Currently targets **SQLite / LibSQL**, but the schema is database-agnostic

When you change Prisma models, run:

```bash
npx prisma migrate dev --name <description>
npx prisma generate
```

---

## 📁 Project Structure

Key folders under `src/`:

* `controllers/` – Request handlers grouped by domain
* `middlewares/` – Authentication, upload handling
* `routes/` – Express route definitions
* `socket/` – Socket event emitters
* `utils/` – Helpers (file parsing, Piston client, round timers)

See the full tree at the top of this README.

---

## 📘 API Endpoints

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/me`

### Rounds

* `/api/rounds`
  (create, list, lock, start/stop, complete, …)

### Other Resources

* Questions
* Test cases
* Submissions
* Teams
* Users
* Admin routes

The server uses **JWT authentication**.
Include the header:

```http
Authorization: Bearer <token>
```

---

## 🧪 Development Notes

* Hot reload via `nodemon` / `tsx` (`npm run dev`)
* Type checking via `tsc` (`npm run build`)
* Add new routes under `routes/` with corresponding controllers
* Keep controllers thin; move business logic to `utils/`

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch

   ```bash
   git checkout -b feature/foo
   ```
3. Commit changes, push, and open a pull request
4. Ensure new code is tested (where applicable)
5. Follow consistent coding style
6. Update this README if you add a major feature

---

## 📄 License

ISC — see the `LICENSE` file.

---

   ```bash
   git clone https://github.com/<your‑user>/debug_duel_backend.git
   cd debug_duel_backend
