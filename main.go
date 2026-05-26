package main

import (
	"digital-declutter-backend/pkg/db"
	"digital-declutter-backend/pkg/logic"
	"digital-declutter-backend/pkg/models"
	"encoding/json"

	"log"
	"net/http"
)

// jsonScanHandler ingests data strings, converts them to variables, scores them, and responds
func jsonScanHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS basic headers so your Next.js frontend can talk to this port
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight browser options checks safely
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var files []models.FileMetadata

	// Decode the incoming raw JSON stream into our structural slice container
	err := json.NewDecoder(r.Body).Decode(&files)
	if err != nil {
		http.Error(w, "Failed to parse JSON network payload", http.StatusBadRequest)
		return
	}

	// Send variables through the mathematical logic calculations engine
	processedFiles := logic.ProcessFiles(files)

	// Stream the sorted data directly back across the network wire as JSON text
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(processedFiles)
}

func main() {

	log.Println(" Starting up the Digital Declutter Backend Engine...")

	// 1. Establish the secure database connection pool at boot up
	db.ConnectDatabase()
	defer db.DB.Close() // Safely flushes all open database pipes when the server terminates

	log.Println(" Database verification passed. Setting up routes...")

	// 2. Register your API endpoint routing gates
	//     Your frontend sends raw JSON text to http://localhost:8080/api/scan.

	// Go sees the path match and activates your jsonScanHandler function.

	// Your function attaches a decoder to the incoming network pipe (r.Body).

	// The decoder converts that raw text stream into real Go variables inside your files slice.
	http.HandleFunc("/api/scan", jsonScanHandler)

	log.Println("🚀 Server is live and listening on http://localhost:8080")
	// 3. Start the blocking network listener engine
	log.Fatal(http.ListenAndServe(":8080", nil))
}
