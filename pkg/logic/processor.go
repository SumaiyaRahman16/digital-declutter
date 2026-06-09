package logic

import (
	"digital-declutter-backend/pkg/models"
	"sync"
	"time"
)

func ProcessFilesConcurrent(files []models.FileMetadata) []models.FileMetadata {
	totalFiles := len(files)
	if totalFiles == 0 {
		return files
	}

	// 1. Determine configuration variables
	numWorkers := 4 // Use 4 parallel execution pipelines
	if totalFiles < numWorkers {
		numWorkers = totalFiles
	}

	// 2. Open type-safe channel pipes to stream processed metrics across memory spaces
	workerChannel := make(chan models.FileMetadata, totalFiles)

	// A WaitGroup acts as a counter to track when all concurrent pipelines finish
	var wg sync.WaitGroup

	// Calculate the capacity limit slice chunk size for each worker thread
	chunkSize := (totalFiles + numWorkers - 1) / numWorkers

	// 3. Spawn background worker threads using the 'go' keyword
	for i := 0; i < numWorkers; i++ {
		start := i * chunkSize
		end := start + chunkSize
		if start >= totalFiles {
			break
		}
		if end > totalFiles {
			end = totalFiles
		}

		wg.Add(1) // Increment the thread safety counter

		// Fire up the concurrent routine wrapper execution block
		go func(fileChunk []models.FileMetadata) {
			defer wg.Done() // Decrement counter when this specific thread completes execution

			for _, file := range fileChunk {
				// Execute math engine scoring computations
				file.Score = calculateClutterScore(file)

				// Push the completed structural data record down into the thread pipe
				workerChannel <- file
			}
		}(files[start:end])
	}

	// 4. Spawn a separate background supervisor thread to close the pipe safely when work completes
	go func() {
		wg.Wait()            // Blocks right here until the counter reaches zero
		close(workerChannel) // Closes the pipe channel so the collection loop knows when to stop
	}()

	// 5. Aggregate streamed values back into a single result slice container
	var results []models.FileMetadata
	for processedFile := range workerChannel {
		results = append(results, processedFile)
	}

	return results
}

// Internal score evaluator calculations algorithm
func calculateClutterScore(file models.FileMetadata) float64 {
	var score float64

	// Size metric rules (Heavier weights assigned to massive multi-gigabyte items)
	const gigabyte = 1024 * 1024 * 1024
	if file.Size > 2*gigabyte {
		score += 50.0
	} else if file.Size > 500*1024*1024 {
		score += 30.0
	} else if file.Size > 100*1024*1024 {
		score += 15.0
	}

	// Age metric rules (Older historical modification limits escalate scores)
	parsedTime, err := time.Parse(time.RFC3339, file.LastModified)
	if err == nil {
		daysOld := time.Since(parsedTime).Hours() / 24
		if daysOld > 365 {
			score += 40.0 // Untouched over a year
		} else if daysOld > 180 {
			score += 20.0 // Untouched over 6 months
		}
	}

	if score > 100.0 {
		score = 100.0
	}
	return score
}
