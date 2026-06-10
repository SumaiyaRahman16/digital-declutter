package api

import (
	"digital-declutter-backend/pkg/db"
	"encoding/json"
	"fmt" // Import fmt for terminal printing
	"net/http"
)

func DeleteAccountHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userID, ok := r.Context().Value(UserIDKey).(int)

	// DIAGNOSTIC 1: Print the resolved UserID to your terminal console
	fmt.Printf(" [DELETE API] Extracted UserID from Context token: %d (Valid key found: %v)\n", userID, ok)

	if !ok || userID <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized session context"})
		return
	}

	// Execute transaction
	err := db.SoftDeleteUser(db.DB, userID)
	if err != nil {
		// DIAGNOSTIC 2: Print out the exact database engine error message
		fmt.Printf("❌ [DELETE API] Database Transaction Failed! Error: %v\n", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Failed to safely process account deletion"})
		return
	}

	fmt.Println("✅ [DELETE API] Transaction finished execution without errors.")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Account successfully terminated"})
}
