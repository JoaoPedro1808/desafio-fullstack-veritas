package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// Define as rotas designadas para os testes
	mux.HandleFunc("GET /tasks", listTasksHandler)
	mux.HandleFunc("POST /tasks", createTaskHandler)
	mux.HandleFunc("PUT /tasks/{id}", updateTaskHandler)
	mux.HandleFunc("DELETE /tasks/{id}", deleteTaskHandler)

	// Comunicação direta para o "frontend"
	corsHandler := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
	
	fmt.Println("Servidor Go rodando na porta 8080")

	if err := http.ListenAndServe(":8080", corsHandler(mux)); err != nil {
		log.Fatalf("Não foi possível iniciar o servidor: %v", err)
	}
}