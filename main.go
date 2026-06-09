package main

import (
	"digital-declutter-backend/pkg/api"
	"digital-declutter-backend/pkg/db"
	"digital-declutter-backend/pkg/logic"
	"digital-declutter-backend/pkg/models"

	"encoding/json"
	"strings"

	"log"
	"net/http"
)

func jsonScanHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
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

	// Process files using your logic layer (runs for both guests and logged-in users)
	processedFiles := logic.ProcessFilesConcurrent(files)

	authHeader := r.Header.Get("Authorization")

	// Check if a token exists in the header
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Call your existing token validation function from your api package
		userID, err := api.ValidateToken(tokenString)
		if err == nil {
			// Token is valid! Calculate sizes and save to database
			var totalSize int64
			for _, f := range processedFiles {
				totalSize += f.Size
			}

			err = db.SaveScanResult(userID, len(processedFiles), totalSize, processedFiles)
			if err != nil {
				log.Printf("⚠️ Background database persistence warning: %v", err)
			}
		} else {
			log.Printf("⚠️ Invalid token provided, skipping database save (processing as guest): %v", err)
		}
	} else {
		// No token found - explicitly skip database saving
		log.Println("ℹ️ No authorization token detected. Processing as a temporary guest scan.")
	}
	// -----------------------------------------------------

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
	http.HandleFunc("/api/scan", jsonScanHandler)
	// http.HandleFunc("/api/scan", api.AuthMiddleware(jsonScanHandler))
	// Authentication Entry Points
	http.HandleFunc("/api/signup", api.PostSignup)
	http.HandleFunc("/api/login", api.PostLogin)

	http.HandleFunc("/api/history", api.AuthMiddleware(api.GetHistoryHandler))
	http.HandleFunc("/api/password", api.AuthMiddleware(api.PostChangePassword))

	log.Println("🚀 Server is live and listening on http://localhost:8080")
	// 3. Start the blocking network listener engine
	log.Fatal(http.ListenAndServe(":8080", nil))

}
