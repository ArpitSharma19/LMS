# 🎓 Modern MERN Stack Learning Management System (LMS)

A robust, production-grade Learning Management System built with the MERN stack. This platform provides a comprehensive environment for Admins, Educators, and Students with a focus on security, stability, and data integrity.

---

## 📌 1. Project Overview

The **Modern LMS** is a full-stack web application designed for scalable online learning. It addresses the need for a self-hosted platform where educators can host content and students can track their learning journey.

**Key Highlights:**
*   **RBAC Architecture**: Specialized dashboards for Admin, Educator, and Student roles.
*   **Atomic Business Logic**: Secure enrollment flow with 85/15 revenue split using database transactions.
*   **Security First**: Centralized error handling, Zod validation, and brute-force protection.

---

## 📂 2. Full Project Structure

### 📁 Root Directory
```text
LMS/
├── client/              # React (Vite) Frontend
├── server/              # Node.js (Express) Backend
├── testsprite_tests/    # Automated E2E & Backend Test Suite
├── README.md            # Project Documentation
└── testsprite.config.json
```

### 📁 Backend (`/server`)
```text
server/
├── config/              # Configuration (DB, Cloudinary, Winston, Env)
├── controllers/         # Business logic & Request handlers
├── middleware/          # Security, Auth, Validation, & Error middlewares
├── models/              # Sequelize schemas & associations
├── routes/              # API Route definitions
├── scripts/             # DB Seeding and setup scripts
├── services/            # Third-party integrations (Groq AI, Email)
├── utils/               # Reusable helpers (ApiError, catchAsync)
├── validations/         # Zod validation schemas
├── logs/                # Application & Error logs
├── server.js            # Entry point
└── package.json
```

### 📁 Frontend (`/client`)
```text
client/
├── public/              # Static public assets
├── src/
│   ├── api/             # Axios instance & interceptors
│   ├── assets/          # Shared images, icons, and styles
│   ├── components/      # UI Components (Admin, Educator, Student, Chatbot)
│   ├── context/         # AppContext for global state management
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # View components for all roles
│   ├── services/        # Frontend API call services
│   ├── App.jsx          # Main routing & application wrapper
│   └── main.jsx         # React entry point
└── index.html
```

---

## ⚙️ 3. Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, Axios, React Router.
*   **Backend**: Node.js, Express.js, Sequelize ORM (MySQL).
*   **Security**: JWT, Bcrypt.js, Zod, express-rate-limit.
*   **Logging**: Winston (File/Error), Morgan (HTTP).
*   **Media**: Cloudinary for course thumbnails and assets.

---

## 🚀 4. Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MySQL 8.x
*   Cloudinary API Keys

### Step 1: Backend Setup
```bash
cd server
npm install
# Create .env based on the Environment Variables section below
npm run dev
```

### Step 2: Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 🔑 5. Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` |
| **Educator** | `educator@example.com` | `educator123` |
| **Student** | `student@example.com` | `student123` |

---

## 🛡️ 6. Security & Stability Pass

The system has been hardened for production:
1.  **Centralized Error Handling**: Unified `ApiError` class and global middleware.
2.  **Rate Limiting**: Prevents brute-force on auth and enrollment endpoints.
3.  **Data Integrity**: Sequelize transactions protect financial and enrollment data.
4.  **Schema Validation**: Every request is validated via Zod before processing.

---

## 💰 7. Revenue Model

*   **Platform Fee**: 15% platform commission on every sale.
*   **Educator Earnings**: 85% revenue credited to the creator.
*   **Transactional**: Updates are atomic to prevent revenue leakage.

---

## 🧪 8. Testing

Automated testing is powered by **TestSprite**:
*   Run tests: `npx testsprite` (from root)
*   Tests cover: Authentication, Enrollment, Admin operations, and API stability.

---

## 👨‍💻 9. Author / Contribution

*   **Lead Engineer**: Antigravity AI
*   **QA Lead**: TestSprite
*   **Maintainer**: [User]

---
*Built with ❤️ for a more secure and stable educational future.*
