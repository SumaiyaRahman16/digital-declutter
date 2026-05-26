package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // Registers the pgx driver with database/sql
	"github.com/joho/godotenv"
)

// DB acts as our global connection pool manager
var DB *sql.DB

// ConnectDatabase pulls secrets from .env and sets up the network connection pool
func ConnectDatabase() {
	// 1. Attempt to load the .env file from the root folder
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ Warning: No .env file found, falling back to system environment variables")
	}

	// 2. Safely read credentials out of your laptop's environment memory space
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	// 3. Construct the clean connection string dynamically
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbName)

	// 4. Initialize the background connection pool
	DB, err = sql.Open("pgx", connStr)
	if err != nil {
		log.Fatalf(" Failed to initialize database connection settings: %v", err)
	}

	// 5. Configure optimal pool properties to handle multiple API hits smoothly
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
