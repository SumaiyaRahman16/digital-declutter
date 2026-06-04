package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Define a custom context key type to avoid naming collisions in Go's memory registry
type contextKey string

const UserIDKey contextKey = "userID"

// AuthMiddleware intercepts an incoming request, validates its JWT, and attaches the user identity
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// 2. If it's an OPTIONS check, respond with 200 OK and stop processing early
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		// 1. Extract the Authorization header out of the network stream
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "🔑 Authorization token required", http.StatusUnauthorized)
			return
		}

		// 2. Parse out the "Bearer " prefix format (e.g., "Bearer <token_string>")
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Malformed authorization header format", http.StatusUnauthorized)
			return
		}
		tokenString := parts[1]

		// 3. Parse and cryptographically verify the token signatures
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			// Verify the signing algorithm is exactly HMAC SHA-256
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "❌ Invalid or expired passport token", http.StatusUnauthorized)
			return
		}

		// 4. Extract claims and extract the user ID number out of the decrypted token space
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Failed to read security payload claims", http.StatusUnauthorized)
			return
		}

		// Float64 conversion is necessary because JSON unmarshals numbers as floats by default
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Invalid identity token data mapping", http.StatusUnauthorized)
			return
		}
		userID := int(userIDFloat)

		// 5. Embed the user ID into the request context and let the execution flow to the core function
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}
