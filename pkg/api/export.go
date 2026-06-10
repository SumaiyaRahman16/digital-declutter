package api

import (
	"digital-declutter-backend/pkg/db"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// ExportDataHandler compiles data records into either structured JSON or tabular CSV
func ExportDataHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userID, ok := r.Context().Value(UserIDKey).(int)
	if !ok || userID <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized session access"})
		return
	}

	exportFormat := r.URL.Query().Get("format")
	if exportFormat == "" {
		exportFormat = "json"
	}
	cleanExportedAt := time.Now().Format("2006-01-02 15:04:05")

	// -------------------------------------------------------------------------
	// 🌟 THE MISSING LINK: Log the audit trail row directly into public.data_exports
	// -------------------------------------------------------------------------
	// We pass the global db connection pool (db.DB) and your user ID
	err := db.LogDataExport(db.DB, userID, exportFormat)
	if err != nil {
		// Log the error inside your terminal so you can see it, but don't crash the user's download
		fmt.Printf("⚠️ Background database logging warning: %v\n", err)
	} else {
		fmt.Printf("✅ [DB SUCCESS] Audit log written for User %d into public.data_exports\n", userID)
	}

	// 1. Fetch user email directly
	var userEmail string
	err = db.DB.QueryRow("SELECT email FROM public.users WHERE id = $1", userID).Scan(&userEmail)
	if err != nil {
		userEmail = "user@example.com" // Safe fallback
	}

	// 2. Fetch history records directly
	type InternalRow struct {
		FolderPath  string
		ScannedDate time.Time
		TotalFiles  int
	}
	var history []InternalRow

	// query := `
	// 	SELECT DISTINCT ON (s.id) f.path, s.created_at, s.total_files
	// 	FROM public.scans s
	// 	JOIN public.files f ON s.id = f.scan_id
	// 	WHERE s.user_id = $1 AND s.deleted_at IS NULL
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

	rows, err := db.DB.Query(query, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var r InternalRow
			if err := rows.Scan(&r.FolderPath, &r.ScannedDate, &r.TotalFiles); err == nil {
				history = append(history, r)
			}
		}
	}

	// -------------------------------------------------------------------------
	// 📊 HANDLE CSV FILE GENERATION
	// -------------------------------------------------------------------------
	if exportFormat == "csv" {
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", "attachment; filename=digital_declutter_export.csv")
		w.WriteHeader(http.StatusOK)

		writer := csv.NewWriter(w)
		defer writer.Flush()

		_ = writer.Write([]string{"User Email", "Exported At", "Folder Path / Asset Name", "Scan Date", "Total Files"})

		for _, row := range history {
			_ = writer.Write([]string{
				userEmail,
				cleanExportedAt,
				row.FolderPath,
				row.ScannedDate.Format("2006-01-02 15:04:05"),
				fmt.Sprintf("%d", row.TotalFiles),
			})
		}
		return
	}

	// -------------------------------------------------------------------------
	// 📦 HANDLE JSON GENERATION (Default option)
	// -------------------------------------------------------------------------
	type CleanRow struct {
		FolderPath  string `json:"folder_path"`
		ScannedDate string `json:"scanned_date"`
		TotalFiles  int    `json:"total_files"`
	}

	var cleanHistory []CleanRow
	for _, row := range history {
		cleanHistory = append(cleanHistory, CleanRow{
			FolderPath:  row.FolderPath,
			ScannedDate: row.ScannedDate.Format("2006-01-02 15:04:05"),
			TotalFiles:  row.TotalFiles,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=digital_declutter_export.json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"user_email":  userEmail,
		"exported_at": cleanExportedAt,
		"history":     cleanHistory,
	})
}
