package main

const (
	aFazer = "A Fazer"
	emProgresso = "Em Progresso"
	concluido = "Concluídas"
)

type task struct {
	Id int `json:"id"`
	Nome string `json:"nome"`
	Desc string `json:"desc,omitempty"`
	Status string `json:"status"`
}

func validar(status string) bool {
	switch status {
		case aFazer, emProgresso, concluido:
			return true
		default:
			return false
	}
}