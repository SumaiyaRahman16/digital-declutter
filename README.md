Digital Declutter System
A full-stack storage optimization and directory analytics platform. The application scans local file systems via a Next.js dashboard, processes directory metadata through an intelligent Go ranking algorithm to isolate digital clutter, and tracks metrics over time using PostgreSQL.

🛠️ Tech Stack & Architecture
Frontend Dashboard: Next.js (React), Tailwind CSS

Backend Core: Go (Golang) standard network library

Database Engine: PostgreSQL (with pgx connection pooling)

Configuration: Secure environment mapping via .env

Data Flow: Users ➔ Scans ➔ Files (One-to-Many Relational Cascade Schema)
