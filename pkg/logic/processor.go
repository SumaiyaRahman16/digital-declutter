package logic

import (
	"digital-declutter-backend/pkg/models"
	"sort"
	"time"
)

// ProcessFiles takes the list of files, calculates their clutter score,
// and sorts them from highest (worst) to lowest.
func ProcessFiles(files []models.FileMetadata) []models.FileMetadata {

	currentTime := time.Now().Unix()

	// 1. Loop through the slice by index to modify the original data in memory
	for i := range files {
		// Calculate age in days (seconds difference / seconds in a day)
		lastModifiedTime, _ := time.Parse(time.RFC3339, files[i].LastModified)
		ageInSeconds := float64(currentTime - lastModifiedTime.Unix())
		ageInDays := float64(ageInSeconds) / 86400.0

		// Avoid negative scores if a file timestamp is somehow in the future
		if ageInDays < 0 {
			ageInDays = 0
		}

		// Convert size from bytes to Megabytes (MB)
		sizeInMB := float64(files[i].Size) / 1048576.0

		// Calculate Rottenness Score: Size * Age
		files[i].Score = sizeInMB * ageInDays
	}

	// 2. Sort the slice in-place so highest scores bubble up to index 0
	sort.SliceStable(files, func(i, j int) bool {
		return files[i].Score > files[j].Score
	})

	return files
}
