package models
import "time"

type FileMetadata struct {
	Name         string  `json:"name"`
	Path         string  `json:"path"`
	Size         int64   `json:"size"`
	LastModified string  `json:"last_modified"`
	Score        float64 `json:"score"`
}

type User struct {
	ID           int    `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}


type ExportScanRow struct {
	FolderPath  string    `json:"folder_path"`
	ScannedDate time.Time `json:"scanned_date"`
	TotalFiles  int       `json:"total_files"`
}

// DataExportPayload wraps the finalized collection array returned to the user
type DataExportPayload struct {
	UserEmail string           `json:"user_email"`
	ExportedAt time.Time        `json:"exported_at"`
	History   []ExportScanRow  `json:"history"`
}