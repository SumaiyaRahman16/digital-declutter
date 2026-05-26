package models

type FileMetadata struct {
	Name         string  `json:"name"`
	Path         string  `json:"path"`
	Size         int64   `json:"size"`
	LastModified string  `json:"last_modified"`
	Score        float64 `json:"score"`
}
