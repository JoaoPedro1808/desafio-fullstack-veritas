package main

const (
	AFazer = "A Fazer"
	EmProgresso = "Em Progresso"
	Concluido = "Concluídas"
)

type Task struct {
	Id int `json:"id"`
	Nome string `json:"nome"`
	Desc string `json:"desc,omitempty"`
	Status string `json:"status"`
}

func Validar(status string) bool {
	switch status {
		case AFazer, EmProgresso, Concluido:
			return true
		default:
			return false
	}
}