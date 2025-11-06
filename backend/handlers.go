package main

import (
	"sync"
	"fmt"
	"encoding/json"
	"net/http"
	"strconv"
)

var (
	tasks = make(map[int]task)
	mu = sync.Mutex{}
	nextID = 1
)

func respondWithJSON(w http.ResponseWriter, status int, data interface{}) {
	response, err := json.Marshal(data) // Coverte os dados para json, com o comando Marshal
	
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao converter os dados para json")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(response)
}

// Função para responder com erro
func erroResponse(w http.ResponseWriter, status int, msg string) {
	respondWithJSON(w, status, map[string]string{"error": msg})
}

// Função para responder com sucesso
func sucessResponse(w http.ResponseWriter, status int, msg string, data interface{}) {
	respondWithJSON(w, status, map[string]interface{}{"message": msg, "data": data})
}

// Funçã para criar uma nova tarefa
func createTaskHandler(w http.ResponseWriter, r *http.Request) {
	var task task // Declarar a variavel task, para armazenar as tarefas

	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		erroResponse(w, http.StatusBadRequest, "Erro ao decodificar o corpo da requisição")
		return
	}

	if task.Nome == "" {
		erroResponse(w, http.StatusBadRequest, "O campo (Nome) é obrigatório")
		return
	}

	// Verifica o status da tarefa, se não for informado, define como "A Fazer"
	if task.Status == "" {
		task.Status = aFazer
	} else if !validar(task.Status) {
		msg := fmt.Sprintf("Status inválido: %s", task.Status)
		erroResponse(w, http.StatusBadRequest, msg)
		return
	}

	mu.Lock()

	task.Id = nextID
	nextID++
	tasks[task.Id] = task
	mu.Unlock()

	sucessResponse(w, http.StatusCreated, "Tarefa criada com sucesso", task)
}

// Função para listar as tarefas
func listTasksHandler(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	// Cria a lista de tarefas
	taskLista := make([]task, 0, len(tasks))
	for _, task := range tasks {
		taskLista = append(taskLista, task)
	}

	sucessResponse(w, http.StatusOK, "Lista de tarefas criada com sucesso", taskLista)
}

// Função para atualizar a tarefa
func updateTaskHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		erroResponse(w, http.StatusBadRequest, "Id inválido, deve ser um número")
		return
	}

	var updateTask task

	if err := json.NewDecoder(r.Body).Decode(&updateTask); err != nil {
		erroResponse(w, http.StatusBadRequest, "Erro na requisição")
		return
	}

	if updateTask.Nome == "" {
		erroResponse(w, http.StatusBadRequest, "O campo (Nome) é obrigatório")
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Verifica se a tarefa existe
	existingTask, ok := tasks[id]
	if !ok {
		erroResponse(w, http.StatusNotFound, "Tarefa não encontrada")
		return
	}

	// Verifica o status da tarefa, se não for informado, mantém o status atual
	if updateTask.Status == "" {
		updateTask.Status = existingTask.Status
	} else if !validar(updateTask.Status) {
		msg := fmt.Sprintf("Status inválido: %s", updateTask.Status)
		erroResponse(w, http.StatusBadRequest, msg)
		return
	}

	updateTask.Id = id
	tasks[id] = updateTask
	respondWithJSON(w, http.StatusOK, updateTask)
}

// Função para deletar uma tarefa
func deleteTaskHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		erroResponse(w, http.StatusBadRequest, "Id inválido, deve ser um número")
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Procura pela tarefa
	_, ok := tasks[id]
	if !ok {
		erroResponse(w, http.StatusNotFound, "Tarefa não encontrada")
		return
	}

	delete(tasks, id)

	respondWithJSON(w, http.StatusOK, map[string]string{"mensagem" : "Tarefa excluida com sucesso"})
}