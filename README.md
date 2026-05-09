# HomeBase — ระบบจัดการบ้าน

แอปพลิเคชันสำหรับจัดการบ้านแบบ self-hosted ครอบคลุมการบำรุงรักษา, ทรัพย์สิน, ค่าใช้จ่าย และเอกสารสำคัญ

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go · chi router · pgx/v5 · golang-migrate · Cloudinary |
| Database | PostgreSQL (Neon serverless) |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts |
| Deploy | Render (backend) · Netlify (frontend) |

---

## Features

- **การบำรุงรักษา** — บันทึกและติดตามวันครบกำหนดบำรุงรักษา
- **ทรัพย์สิน** — รายการอุปกรณ์พร้อมแจ้งเตือนวันหมดประกัน (90 วัน)
- **ค่าใช้จ่าย** — บันทึกค่าบิลรายเดือน + กราฟแนวโน้ม
- **เอกสาร** — เก็บไฟล์ PDF/รูปภาพบน Cloudinary พร้อมแจ้งเตือนหมดอายุ (60 วัน)
- **ค้นหา** — ค้นหาข้อมูลทุกหมวดหมู่จากที่เดียว
- **Dashboard** — ภาพรวมรายการสำคัญที่กำลังจะถึง

---

## Getting Started

### Prerequisites

- [Go 1.22+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- PostgreSQL database (แนะนำ [Neon](https://neon.tech) — free tier)
- [Cloudinary](https://cloudinary.com) account (free tier)

---

### Backend

**1. ตั้งค่า environment variables**

```bash
cd backend
cp .env.example .env
```

แก้ไขไฟล์ `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=8080
```

**2. รัน backend**

```bash
cd backend
go run ./cmd/server
```

Server จะรัน migrations อัตโนมัติและเริ่มฟังที่ `http://localhost:8080`

---

### Frontend

**1. ตั้งค่า environment variables**

```bash
cd frontend
cp .env.local.example .env.local
```

แก้ไขไฟล์ `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**2. ติดตั้ง dependencies และรัน**

```bash
cd frontend
npm install
npm run dev
```

เปิดที่ `http://localhost:3000`

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon หรือ PostgreSQL ทั่วไป) | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `PORT` | Port ที่ server จะฟัง (default: `8080`) | ❌ |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | URL ของ backend API | ✅ |

---

## Deployment

### Backend → Render

1. Push โค้ดขึ้น GitHub
2. สร้าง Web Service ใหม่บน [Render](https://render.com) ชี้ไปที่ repo นี้
3. Render จะอ่าน `render.yaml` อัตโนมัติ
4. ตั้งค่า environment variables ใน Render dashboard

### Frontend → Netlify

1. เชื่อม repo กับ [Netlify](https://netlify.com)
2. Netlify จะอ่าน `netlify.toml` อัตโนมัติ
3. ตั้งค่า `NEXT_PUBLIC_API_URL` ให้ชี้ไปที่ Render URL

---

## API Endpoints

```
GET    /api/dashboard
GET    /api/search?q=...

GET|POST              /api/maintenance
GET|PUT|DELETE        /api/maintenance/:id

GET|POST              /api/assets
GET|PUT|DELETE        /api/assets/:id

GET|POST              /api/expenses
GET                   /api/expenses/trends
GET|PUT|DELETE        /api/expenses/:id

GET|POST              /api/documents
GET|PUT|DELETE        /api/documents/:id
```

---

## Project Structure

```
home-management/
├── backend/
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── db/db.go                # DB connection & migrations
│   │   ├── handlers/               # HTTP handlers (chi)
│   │   └── models/models.go        # Data models
│   ├── migrations/                 # SQL migration files
│   ├── .env.example
│   └── go.mod
├── frontend/
│   ├── app/                        # Next.js App Router pages
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                  # API client
│   │   └── utils.ts
│   ├── types/index.ts
│   └── .env.local.example
├── render.yaml                     # Render deployment config
├── netlify.toml                    # Netlify deployment config
└── .gitignore
```

---

## Disclaimer

> **โปรเจคนี้ถูกสร้างขึ้นทั้งหมดโดย [Claude Code](https://claude.ai/code)** (Anthropic's AI coding assistant) โดยไม่มีการเขียนโค้ดด้วยมือแม้แต่บรรทัดเดียว
>
> This project was built entirely using **Claude Code** — Anthropic's agentic AI coding tool. No code was written by hand. It serves as a demonstration of what AI-assisted development can produce end-to-end, from backend API design to frontend UI and deployment configuration.
