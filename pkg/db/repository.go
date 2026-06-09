package db

import (
	"context"
	"digital-declutter-backend/pkg/models"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// CreateUser takes a raw password, hashes it, and stores the user in the database
func CreateUser(email string, rawPassword string) error {
	// Hash password with a secure default work factor cost of 10
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(rawPassword), 10)
	if err != nil {
		return err
	}

	query := `INSERT INTO users (email, password_hash) VALUES ($1, $2);`
	_, err = DB.Exec(query, email, string(hashedBytes))
	return err
}

// GetUserByEmail searches the database for a user and returns their struct metadata
func GetUserByEmail(email string) (*models.User, error) {
	query := `SELECT id, email, password_hash FROM users WHERE email = $1;`

	var user models.User
	err := DB.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// SaveScanResult inserts a parent scan metadata record and all its child files into the DB using an atomic transaction.
func SaveScanResult(userID int, totalFiles int, totalSize int64, files []models.FileMetadata) error {
	ctx := context.Background()

	// 1. Begin a database transaction. If ANY single query fails, everything rolls back cleanly.
	tx, err := DB.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("❌ Transaction initialization failed: %v", err)
		return err
	}
	defer tx.Rollback() // Safeguard: Auto-rolls back if execution hits an unhandled error path.

	// 2. Insert the main Scan event record and retrieve the auto-generated SERIAL ID from Postgres
	var scanID int
	scanQuery := `
		INSERT INTO scans (user_id, total_files, total_size) 
		VALUES ($1, $2, $3) 
		RETURNING id;`

	err = tx.QueryRowContext(ctx, scanQuery, userID, totalFiles, totalSize).Scan(&scanID)
	if err != nil {
		log.Printf("❌ Scan summary insert failed: %v", err)
		return err
	}

	// 3. Prepare an optimized SQL statement in memory for high-performance looping
	fileQuery := `
		INSERT INTO files (scan_id, name, path, size, last_modified, score) 
		VALUES ($1, $2, $3, $4, $5, $6);`

	stmt, err := tx.PrepareContext(ctx, fileQuery)
	if err != nil {
		log.Printf("❌ Failed to pre-compile file statement: %v", err)
		return err
	}
	defer stmt.Close()

	// 4. Loop through the slice and execute an insert for every single file
	for _, file := range files {
		_, err = stmt.ExecContext(ctx, scanID, file.Name, file.Path, file.Size, file.LastModified, file.Score)
		if err != nil {
			log.Printf("❌ Failed to write file record [%s]: %v", file.Name, err)
			return err
		}
	}

	// 5. Commit all execution steps permanently to disk
	if err = tx.Commit(); err != nil {
		log.Printf("❌ Transaction commit failed: %v", err)
		return err
	}

	log.Printf("💾 Transaction succeeded! Saved Scan #%d containing %d records.", scanID, totalFiles)
	return nil
}

// GetUserScanHistory fetches all historical scan summary records for a specific user ID
// GetUserScanHistory retrieves macro scan logs along with their nested file arrays
func GetUserScanHistory(userID int) ([]map[string]interface{}, error) {
	// 1. Fetch all parent scans for the user
	scanQuery := `
		SELECT id, total_files, total_size, created_at 
		FROM scans 
		WHERE user_id = $1 
		ORDER BY created_at DESC;`

	scanRows, err := DB.Query(scanQuery, userID)
	if err != nil {
		return nil, err
	}
	defer scanRows.Close()

	var history []map[string]interface{}

	for scanRows.Next() {
		var scanID, totalFiles int
		var totalSize int64
		var createdAt time.Time

		if err := scanRows.Scan(&scanID, &totalFiles, &totalSize, &createdAt); err != nil {
			return nil, err
		}

		// 2. For each scan, fetch its associated children files from the files table
		fileQuery := `
			SELECT name, path, size, score 
			FROM files 
			WHERE scan_id = $1;`

		fileRows, err := DB.Query(fileQuery, scanID)
		if err != nil {
			return nil, err
		}

		var filesList []map[string]interface{}
		var rootPath string // We'll extract this to show a clean "Folder Path" on the UI

		for fileRows.Next() {
			var name, path string
			var size int64
			var score float64

			if err := fileRows.Scan(&name, &path, &size, &score); err != nil {
				fileRows.Close()
				return nil, err
			}

			// Capture the root path from the first file to show where the scan happened
			if rootPath == "" && path != "" {
				rootPath = path
			}

			filesList = append(filesList, map[string]interface{}{
				"name":  name,
				"path":  path,
				"size":  size,
				"score": score,
			})
		}
		fileRows.Close()

		// 3. Combine them into a single nested payload structure
		history = append(history, map[string]interface{}{
			"scan_id":     scanID,
			"folder_path": rootPath,
			"total_files": totalFiles,
			"total_size":  totalSize,
			"scanned_at":  createdAt.Format("2006-01-02 15:04:05"),
			"files":       filesList, // 👈 Nesting the children files right inside!
		})
	}

	return history, nil
}

// GetUserByID searches the database for a user by ID and returns their struct metadata
func GetUserByID(id int) (*models.User, error) {
	query := `SELECT id, email, password_hash FROM users WHERE id = $1;`

	var user models.User
	err := DB.QueryRow(query, id).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUserPassword hashes a new password and updates the user's record in the database
func UpdateUserPassword(id int, newRawPassword string) error {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(newRawPassword), 10)
	if err != nil {
		return err
	}

	query := `UPDATE users SET password_hash = $1 WHERE id = $2;`
	_, err = DB.Exec(query, string(hashedBytes), id)
	return err
}
