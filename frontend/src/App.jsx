import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from './assets/components/Column';
import './App.css';

const statusMap = {
    "A Fazer": "column-1",
    "Em Progresso": "column-2",
    "Concluídas": "column-3",
};

const columnMap = {
    "column-1": "A Fazer",
    "column-2": "Em Progresso",
    "column-3": "Concluídas",
};

const emptyBoard = {
    tasks: {},
    columns: {
        "column-1": {id: "column-1", title: "A Fazer", taskIds: []},
        "column-2": {id: "column-2", title: "Em Progresso", taskIds: []},
        "column-3": {id: "column-3", title: "Concluídas", taskIds: []},  
    },
    columnOrder: ["column-1", "column-2", "column-3"]
};

const API = "http://localhost:8080";

/**
 * @param {Array} tasksArray
*/
function formatData(tasksArray = []) {
    const tasks = {};
    const columns = {...emptyBoard.columns};

    columns["column-1"].taskIds = [];
    columns["column-2"].taskIds = [];
    columns["column-3"].taskIds = [];

    tasksArray.forEach(task => {
        const frontendId = `task-${task.id}`;

        const frontendTask = {
            id: frontendId,
            db_id: task.id,
            nome: task.nome,
            fullTask: task,
        }

        tasks[frontendId] = frontendTask;

        const columnId = statusMap[task.status];

        if (columnId) {
            columns[columnId].taskIds.push(frontendId)
        }
    });

    return {
        ...emptyBoard,
        tasks,
        columns,
    };
}

function App() {
    const [board, setBoard] = useState(emptyBoard);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            console.log("Componente marcado como montado");
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const fetchTask = useCallback(() =>{
        console.log("--- INICIANDO FETCH TASK ---");
        setLoading(true);
        setError(null);

        fetch(`${API}/tasks`)
            .then(response => {
                console.log("FETCH: Resposta recebida", response.status);
                if (!response.ok) {
                    throw new Error("Falha ao buscar dados");
                }
                return response.json();
            })
            .then(data => {
                console.log("FETCH: Dados recebidos JSON", data);
                const tasksArray = data.data || data || [];
                const formatedBoard = formatData(tasksArray);
                setBoard(formatedBoard);
                setLoading(false);
                setError(null);
            })
            .catch(error => {
                console.error("FETCH: Erro capturado", error);
                setBoard(emptyBoard);
                setLoading(false);
                setError("Erro de conexão com os dados")
            })
            .finally(() => {
                console.log("--- FINALIZANDO FETCH TASK (setLoading false) ---");
                setLoading(false);
            });
    }, []);

    const handlerCreate = async (nome) => {
        const newTaskData = {
            nome: nome,
            desc: "",
            status: "A Fazer",
        };

        try {
            const response = await fetch(`${API}/tasks`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTaskData)
            });
            if (!response.ok) {
                throw new error("Erro ao criar tarefa")
            }
            fetchTask()
        }
        catch (error) {
            setError(error.message)
        }
    };

    const handlerDelete = async (db_id) => {
        if (!window.confirm("Certeza que deseja deletar a tarefa")) {
            return;
        }

        try {
            const taskDelete = `task-${db_id}`;

            setBoard(prevBoard => {
                const newTasks = {...prevBoard.tasks};
                delete newTasks[taskDelete];

                const newColumns = {...prevBoard.columns};

                Object.keys(newColumns).forEach(columnId => {
                    newColumns[columnId] = {
                        ...newColumns[columnId],
                        taskIds: newColumns[columnId].taskIds.filter(id => id !== taskDelete)
                    };
                });
                return {
                    ...prevBoard,
                    tasks: newTasks,
                    columns: newColumns
                };
            });
            const response = await fetch(`${API}/tasks/${db_id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Erro ao deletar a tarefa")
            };
        }
        catch (error) {
            setError(error.message);
            fetchTask();
        }
    };

    useEffect(() => {
        fetchTask();
    }, [fetchTask])

    const onDragEnd = (result) => {
        const {destination, source, draggableId} = result;

        if (!destination) {
            return;
        }

        if (!board.tasks[draggableId]) {
            console.warn(`${draggableId} não encontrada`);
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const startColumn = board.columns[source.droppableId];
        const endColumn = board.columns[destination.droppableId];

        if (startColumn.id === endColumn.id) {
            const newTaskIds = Array.from(startColumn.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const newColumn = {
                ...startColumn,
                taskIds: newTaskIds,
            };

            setBoard(prevBoard => ({
                ...prevBoard,
                columns: {
                    ...prevBoard.columns,
                    [newColumn.id]: newColumn,
                },
            }));
            return;
        }

        const startTaskIds = Array.from(startColumn.taskIds);
        startTaskIds.splice(source.index, 1);
        const newStartColumn = {
            ...startColumn,
            taskIds: startTaskIds,
        };

        const endTaskIds = Array.from(endColumn.taskIds);
        endTaskIds.splice(destination.index, 0, draggableId);
        const newEndColumn = {
            ...endColumn,
            taskIds: endTaskIds,
        };

        setBoard(prevBoard => ({
            ...prevBoard,
            columns: {
              ...prevBoard.columns,
              [newStartColumn.id]: newStartColumn,
              [newEndColumn.id]: newEndColumn,
            },
        }));

        const task = board.tasks[draggableId];
        const newStatus = columnMap[destination.droppableId];

        const taskToUpdate = {
            ...task.fullTask,
            status: newStatus,
        };

        fetch(`http://localhost:8080/tasks/${task.db_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskToUpdate),
        })
        .then(response => response.json())
        .then(updateTask => {

            setBoard(prevBoard => ({
                ...prevBoard,
                tasks: {
                    ...prevBoard.tasks,
                    [draggableId]: {
                        ...prevBoard.tasks[draggableId],
                        fullTask: updateTask.data || updateTask
                    }
                }
            }));
        })
    };

    // Se ainda estiver carregando após 3 segundos, força a renderização
    const [forceRender, setForceRender] = useState(false);
    
    useEffect(() => {
        const forceTimeout = setTimeout(() => {
            if (loading) {
                setForceRender(true);
                setLoading(false);
                setBoard(emptyBoard);
            }
        }, 3000);
        
        return () => clearTimeout(forceTimeout);
    }, [loading]);
    
    // Renderizar loading apenas se realmente estiver carregando e não forçado
    if (loading && !forceRender) {
        return (
            <div className="loading-container">
                <div>
                    <h1>Carregando...</h1>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>Erro: {error}</p>}
                </div>
            </div>
        );
    }

    // Garantir que sempre temos as colunas
    const columnsToRender = board?.columnOrder || emptyBoard.columnOrder || [];
    const columnsData = board?.columns || emptyBoard.columns || {};

    console.log("=== Renderizando board ===");
    console.log("columnsToRender:", columnsToRender);
    console.log("columnsData:", columnsData);

    try {
        return (
            <div className="app-container">
                <h1 className="app-header">Kanban Pessoal</h1>
                {error && (
                    <div className="error-message">
                        <strong>Erro ao tentar se comunicar com o banco de dados: </strong> {error}
                    </div>
                )}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="kanban-board">
                        {columnsToRender && columnsToRender.length > 0 ? (
                            columnsToRender.map((columnId) => {
                                try {
                                    const column = columnsData[columnId];
                                    if (!column) {
                                        console.warn(`Coluna ${columnId} não encontrada em columnsData`);
                                        return (
                                            <div key={columnId} style={{ padding: '20px', border: '1px solid red' }}>
                                                Coluna {columnId} não encontrada
                                            </div>
                                        );
                                    }
                                    const tasks = (column.taskIds || [])
                                        .map((taskId) => {
                                            const task = board?.tasks?.[taskId];
                                            return task;
                                        })
                                        .filter(task => task !== undefined && task !== null);
                                    return <Column key={column.id} column={{...column, tasks}} onCreateTask={handlerCreate} onDeleteTask={handlerDelete}/>;
                                } catch (colError) {
                                    return (
                                        <div key={columnId} style={{ padding: '20px', border: '1px solid red', color: 'red' }}>
                                            Erro ao renderizar coluna {columnId}: {colError.message}
                                        </div>
                                    );
                                }
                            })
                        ) : (
                            <div className="no-columns-message">
                                <p>Nenhuma coluna encontrada.</p>
                                <p>columnsToRender: {JSON.stringify(columnsToRender)}</p>
                                <p>columnsData keys: {JSON.stringify(Object.keys(columnsData))}</p>
                                <p>Verifique o console para mais detalhes.</p>
                            </div>
                        )}
                    </div>
                </DragDropContext>
            </div>
        );
    } catch (renderError) {
        console.error("=== ERRO CRÍTICO NA RENDERIZAÇÃO ===", renderError);
        return (
            <div className="app-container" style={{ padding: '40px', color: 'red' }}>
                <h1>Erro ao renderizar o aplicativo</h1>
                <p><strong>Erro:</strong> {renderError.message}</p>
                <pre>{renderError.stack}</pre>
                <button onClick={() => window.location.reload()} style={{ 
                    padding: '10px 20px', 
                    marginTop: '20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}>
                    Recarregar Página
                </button>
            </div>
        );
    }
}

export default App;