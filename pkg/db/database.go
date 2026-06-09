package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

var DB *sql.DB

func ConnectDatabase() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ Warning: No .env file found, falling back to system environment variables")
	}

	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbName)

	DB, err = sql.Open("pgx", connStr)
	if err != nil {
		log.Fatalf(" Failed to initialize database connection settings: %v", err)
	}

	DB.SetMaxOpenConns(25)                 // Max active database pipes open at once
	DB.SetMaxIdleConns(25)                 // Keep up to 25 spare pipes warm in reserve
	DB.SetConnMaxLifetime(5 * time.Minute) // Cycle old pipes out every 5 mins

	// 6. Physically ping the database container to verify everything works
	err = DB.Ping()
	if err != nil {
		log.Fatalf(" Database is completely unreachable! Double check your .env credentials: %v", err)
	}

	fmt.Println("Database Connection Pool successfully initialized securely via .env!")
}
