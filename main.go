package main

import (
	"digital-declutter-backend/pkg/models"
	"encoding/json"
	"fmt"
	"net/http"
)

func jsonScanHandler(w http.ResponseWriter, r *http.Request) {

	var files []models.FileMetadata

	err := json.NewDecoder(r.Body).Decode(&files)
	if err != nil {
		http.Error(w, "Failed to parse JSON text payload", http.StatusBadRequest)
		return
	}

	// 4. Print the total count to your terminal console to verify it worked!
	fmt.Printf("Successfully scanned and parsed %d files!\n", len(files))

	// 5. Send a quick success confirmation response back to the network bridge
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Scan data ingested successfully")

}

func main() {
	//     Your frontend sends raw JSON text to http://localhost:8080/api/scan.

	// Go sees the path match and activates your jsonScanHandler function.

	// Your function attaches a decoder to the incoming network pipe (r.Body).

	// The decoder converts that raw text stream into real Go variables inside your files slice.

	http.HandleFunc("/api/scan", jsonScanHandler)
	//listen and serve on port 8080
	http.ListenAndServe(":8080", nil)

}
