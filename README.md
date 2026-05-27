
 Digital Declutter Backend

A high-performance **Go** microservice that ingests local file metadata, processes it through a custom scoring engine to pinpoint digital clutter, and stores structured history logs using **PostgreSQL**.

🛠️ Tech Stack & Architecture

* **Backend Core:** Go (Golang) standard network library
* **Database:** PostgreSQL (with `pgx` connection pooling)
* **Configuration:** Secure environment mapping via `.env`
* **Data Flow:** `Users` ➔ `Scans` ➔ `Files` (One-to-Many Relational Schema)

