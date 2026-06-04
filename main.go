package main

import (
	"digital-declutter-backend/pkg/api"
	"digital-declutter-backend/pkg/db"
	"digital-declutter-backend/pkg/logic"
	"digital-declutter-backend/pkg/models"

	"encoding/json"

	"log"
	"net/http"
)

// jsonScanHandler ingests data strings, converts them to variables, scores them, and responds
func jsonScanHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	// ⚠️ ADD 'Authorization' HERE:
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var files []models.FileMetadata
	err := json.NewDecoder(r.Body).Decode(&files)
	if err != nil {
		http.Error(w, "Failed to parse JSON network payload", http.StatusBadRequest)
		return
	}

	// 1. Process files via the scoring logic engine
	processedFiles := logic.ProcessFilesConcurrent(files)
	// 2. Compute aggregate variables for the parent scan summary record

	// --- 💾 DYNAMIC SAVE OPERATION ---
	// Extract the real authenticated User ID passed forward by the AuthMiddleware token check
	userID, ok := r.Context().Value(api.UserIDKey).(int)
	if !ok {
		// Fallback safeguard if identity mapping is missing
		userID = 1
	}

	var totalSize int64
	for _, f := range processedFiles {
		totalSize += f.Size
	}

	// ✅ Pass the dynamic userID variable instead of mockUserID!
	err = db.SaveScanResult(userID, len(processedFiles), totalSize, processedFiles)
	if err != nil {
		log.Printf("⚠️ Background database persistence warning: %v", err)
	}
	// ------------------------------------------

	// 4. Stream data back to the client UI
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
	// Your frontend sends raw JSON text to http://localhost:8080/api/scan.

	// Go sees the path match and activates your jsonScanHandler function.

	// Your function attaches a decoder to the incoming network pipe (r.Body).

	// // The decoder converts that raw text stream into real Go variables inside your files slice.
	// http.HandleFunc("/api/scan", jsonScanHandler)
	http.HandleFunc("/api/scan", api.AuthMiddleware(jsonScanHandler))
	// Authentication Entry Points
	http.HandleFunc("/api/signup", api.PostSignup)
	http.HandleFunc("/api/login", api.PostLogin)

	http.HandleFunc("/api/history", api.AuthMiddleware(api.GetHistoryHandler))

	log.Println("🚀 Server is live and listening on http://localhost:8080")
	// 3. Start the blocking network listener engine
	log.Fatal(http.ListenAndServe(":8080", nil))

}
