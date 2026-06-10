package db

import (
	"context"
	"database/sql"
	"digital-declutter-backend/pkg/models"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

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

func GetUserByEmail(email string) (*models.User, error) {
	query := `SELECT id, email, password_hash FROM users WHERE email = $1;`

	var user models.User
	err := DB.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func SaveScanResult(userID int, totalFiles int, totalSize int64, files []models.FileMetadata) error {
	ctx := context.Background()

	tx, err := DB.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("❌ Transaction initialization failed: %v", err)
		return err
	}
	defer tx.Rollback()

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

	fileQuery := `
		INSERT INTO files (scan_id, name, path, size, last_modified, score) 
		VALUES ($1, $2, $3, $4, $5, $6);`

	stmt, err := tx.PrepareContext(ctx, fileQuery)
	if err != nil {
		log.Printf("❌ Failed to pre-compile file statement: %v", err)
		return err
	}
	defer stmt.Close()

	for _, file := range files {
		_, err = stmt.ExecContext(ctx, scanID, file.Name, file.Path, file.Size, file.LastModified, file.Score)
		if err != nil {
			log.Printf("❌ Failed to write file record [%s]: %v", file.Name, err)
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		log.Printf("❌ Transaction commit failed: %v", err)
		return err
	}

	log.Printf("💾 Transaction succeeded! Saved Scan #%d containing %d records.", scanID, totalFiles)
	return nil
}

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

func GetUserExportData(db *sql.DB, userID int) (models.DataExportPayload, error) {
	var payload models.DataExportPayload
	payload.ExportedAt = time.Now()

	// 1. Get user email
	err := db.QueryRow("SELECT email FROM public.users WHERE id = $1 AND deleted_at IS NULL", userID).Scan(&payload.UserEmail)
	if err != nil {
		return payload, err
	}

	// 2. Query folder name/path, scan date, and total files from scans/files joined
	// Using DISTINCT ON or MIN/MAX on path guarantees we get one folder path string representing the scan session
	// query := `
	// 	SELECT DISTINCT ON (s.id) f.path, s.created_at, s.total_files
	// 	FROM public.scans s
	// 	JOIN public.files f ON s.id = f.scan_id
	// 	WHERE s.user_id = $1 AND s.deleted_at IS NULL AND f.deleted_at IS NULL
	// 	ORDER BY s.id, s.created_at DESC`
	query := `
        SELECT DISTINCT ON (s.id) 
            split_part(f.path, '/', 1) AS folder_name, 
            s.created_at, 
            s.total_files
        FROM public.scans s
        JOIN public.files f ON s.id = f.scan_id
        WHERE s.user_id = $1 AND s.deleted_at IS NULL
        ORDER BY s.id, s.created_at DESC`

	rows, err := db.Query(query, userID)
	if err != nil {
		return payload, err
	}
	defer rows.Close()

	for rows.Next() {
		var row models.ExportScanRow
		err := rows.Scan(&row.FolderPath, &row.ScannedDate, &row.TotalFiles)
		if err != nil {
			return payload, err
		}
		payload.History = append(payload.History, row)
	}

	return payload, nil
}

// LogDataExport inserts a tracking entry into public.data_exports as requested by your teacher
// func LogDataExport(db *sql.DB, userID int) error {
// 	query := `
// 		INSERT INTO public.data_exports (user_id, request_type, status, formats, requested_at, completed_at)
// 		VALUES ($1, 'full_export', 'completed', 'json', NOW(), NOW())`

//		_, err := db.Exec(query, userID)
//		return err
//	}
//
// LogDataExport inserts a tracking entry into public.data_exports matching all rubric fields
func LogDataExport(db *sql.DB, userID int, formatType string) error {
	// Construct a clean simulation path to show where the generated download link routes
	simulatedDownloadURL := fmt.Sprintf("/api/export?format=%s", formatType)

	query := `
		INSERT INTO public.data_exports (user_id, request_type, status, file_url, formats, requested_at, completed_at)
		VALUES ($1, 'full_export', 'completed', $2, $3, NOW(), NOW())`

	_, err := db.Exec(query, userID, simulatedDownloadURL, formatType)
	return err
}

// SoftDeleteUser updates deleted_at fields for the user and their associated scans/files
// SoftDeleteUser completely deletes user rows and cascading data records permanently (Hard Delete)
func SoftDeleteUser(db *sql.DB, userID int) error {
	// Start a transaction to ensure everything is deleted cleanly or not at all
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Permanently delete all files linked to this user's scans
	fileQuery := `
		DELETE FROM public.files 
		WHERE scan_id IN (SELECT id FROM public.scans WHERE user_id = $1)`
	_, err = tx.Exec(fileQuery, userID)
	if err != nil {
		return err
	}

	// 2. Permanently delete all scans linked to this user
	scanQuery := "DELETE FROM public.scans WHERE user_id = $1"
	_, err = tx.Exec(scanQuery, userID)
	if err != nil {
		return err
	}

	// 3. Permanently delete the user account row itself from the users table
	userQuery := "DELETE FROM public.users WHERE id = $1"
	_, err = tx.Exec(userQuery, userID)
	if err != nil {
		return err
	}

	// Commit the changes to the database
	return tx.Commit()
}
