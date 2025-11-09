package main

import (
	"fmt"
	"encoding/json"
	"net/http"
	"strconv"
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
	var task Task // Declarar a variavel task, para armazenar as tarefas

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
		task.Status = AFazer
	} else if !Validar(task.Status) {
		msg := fmt.Sprintf("Status inválido: %s", task.Status)
		erroResponse(w, http.StatusBadRequest, msg)
		return
	}

	stmt, err := db.Prepare("INSERT INTO task(nome, desc, status) VALUES(?, ?, ?)")
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao preparar a query")
		return
	}

	defer stmt.Close()

	res, err := stmt.Exec(task.Nome, task.Desc, task.Status)
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao prperar as query")
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao executar o codigo")
		return
	}

	task.Id = int(id)
	sucessResponse(w, http.StatusCreated, "Tarefa criada com sucesso", task)
}

// Função para listar as tarefas
func listTasksHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, nome, desc, status FROM task")
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao buscar task")
		return
	}

	defer rows.Close()

	tasklista := []Task{}

	for rows.Next() {
		var t Task

		if err := rows.Scan(&t.Id, &t.Nome, &t.Desc, &t.Status); err != nil {
			erroResponse(w, http.StatusInternalServerError, "Erro ao escanear task")
			return
		}
		tasklista = append(tasklista, t)
	}

	sucessResponse(w, http.StatusOK, "Lista de tarefas criada com sucesso", tasklista)
}

// Função para atualizar a tarefa
func updateTaskHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)

	if err != nil {
		erroResponse(w, http.StatusBadRequest, "Id inválido, deve ser um número")
		return
	}

	var updateTask Task
	if err := json.NewDecoder(r.Body).Decode(&updateTask); err != nil {
		erroResponse(w, http.StatusBadRequest, "Erro na requisição")
		return
	}

	if updateTask.Nome == "" {
		erroResponse(w, http.StatusBadRequest, "O campo (Nome) é obrigatório")
		return
	}

	stmt, err := db.Prepare("UPDATE task SET nome = ?, desc = ?, status = ? WHERE id = ?")
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao preparar as querys")
		return
	}

	defer stmt.Close()

	res, err := stmt.Exec(updateTask.Nome, updateTask.Desc, updateTask.Status, id)
	if err != nil {
    	erroResponse(w, http.StatusInternalServerError, "Erro ao executar o update")
    	return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		erroResponse(w, http.StatusInternalServerError, "Tarefa não encontarda")
		return
	}

	updateTask.Id = id
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

	stmt, err := db.Prepare("DELETE from task WHERE id = ?")
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao preparar a query")
		return
	}

	defer stmt.Close()

	res, err := stmt.Exec(id)
	if err != nil {
		erroResponse(w, http.StatusInternalServerError, "Erro ao deletar a tarefa")
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		erroResponse(w, http.StatusInternalServerError, "Tarefa não encontarda")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"mensagem" : "Tarefa excluida com sucesso"})
}