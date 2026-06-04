package models

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
	PasswordHash string `json:"-"` // The "-" character completely hides this from JSON outputs
}
