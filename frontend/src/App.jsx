import React, { useState, useEffect } from 'react';
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
    
    // Forçar montagem após um delay mínimo
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            console.log("Componente marcado como montado");
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        console.log("=== App montado, iniciando fetch ===");
        let isMounted = true;
        let timeoutId;
        
        // Função para parar o loading
        const stopLoading = () => {
            if (isMounted) {
                console.log("Parando loading...");
                setLoading(false);
            }
        };
        
        // Timeout de segurança - se não receber resposta em 2 segundos, mostra o board vazio
        timeoutId = setTimeout(() => {
            console.warn("=== TIMEOUT: Forçando renderização do board vazio ===");
            if (isMounted) {
                setError("Timeout ao conectar com o servidor (aguardando mais de 2 segundos)");
                setBoard(emptyBoard);
                stopLoading();
            }
        }, 2000);

        // Tentar buscar dados
        fetch("http://localhost:8080/tasks")
        .then(response => {
            console.log("Response recebida:", response.status, response.statusText);
            if (timeoutId) clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Falha ao buscar dados: ${response.status} ${response.statusText}`);  
            }
            return response.json();
        })
        .then(data => {
            if (!isMounted) {
                console.log("Componente desmontado, ignorando resposta");
                return;
            }
            if (timeoutId) clearTimeout(timeoutId);
            console.log("=== Dados recebidos do backend ===", data);
            const tasksArray = data.data || data || [];
            console.log("Array de tarefas:", tasksArray);
            const formattedBoard = formatData(tasksArray);
            console.log("=== Board formatado ===", formattedBoard);
            setBoard(formattedBoard);
            stopLoading();
            setError(null);
        })
        .catch(error => {
            if (!isMounted) {
                console.log("Componente desmontado, ignorando erro");
                return;
            }
            console.error("=== ERRO ao buscar tarefas ===", error);
            if (timeoutId) clearTimeout(timeoutId);
            setError(error.message || "Erro desconhecido");
            console.log("=== Mostrando board vazio devido ao erro ===");
            setBoard(emptyBoard);
            stopLoading();
        })

        return () => {
            console.log("=== Limpando useEffect ===");
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [])

    const onDragEnd = (result) => {
        const {destination, source, draggableId} = result;

        if (!destination) {
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
            console.log("Banco de dados atualizado com sucesso", updateTask);

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
        .catch(error => {
            console.error("Erro ao atualizar o banco de dados: ", error);
        });
    };
    
    console.log("=== RENDER: loading =", loading, "error =", error);
    console.log("=== RENDER: board =", board);
    console.log("=== RENDER: columnOrder =", board?.columnOrder);
    console.log("=== RENDER: columns =", board?.columns);

    // Se ainda estiver carregando após 3 segundos, força a renderização
    const [forceRender, setForceRender] = useState(false);
    
    useEffect(() => {
        const forceTimeout = setTimeout(() => {
            if (loading) {
                console.warn("=== FORÇANDO RENDER: Loading muito longo ===");
                setForceRender(true);
                setLoading(false);
                setBoard(emptyBoard);
            }
        }, 3000);
        
        return () => clearTimeout(forceTimeout);
    }, [loading]);

    // Se não montou ainda, mostra loading
    if (!mounted) {
        return (
            <div className="loading-container">
                <div>
                    <h1>Inicializando...</h1>
                </div>
            </div>
        );
    }
    
    // Renderizar loading apenas se realmente estiver carregando e não forçado
    if (loading && !forceRender) {
        console.log("=== Renderizando tela de loading ===");
        return (
            <div className="loading-container">
                <div>
                    <h1>Carregando quadro Kanban...</h1>
                    <p>Aguarde enquanto buscamos os dados do servidor...</p>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>Erro: {error}</p>}
                </div>
            </div>
        );
    }
    
    // FORÇA renderização após 4 segundos máximo
    if (loading) {
        console.warn("=== LOADING PRESO - FORÇANDO RENDER ===");
        // Não retorna loading, deixa passar para renderizar o board
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
                <h1 className="app-header">Veritas Kanban</h1>
                {error && (
                    <div className="error-message">
                        <strong>Erro ao conectar com o backend:</strong> {error}
                        <small>Certifique-se de que o servidor Go está rodando na porta 8080</small>
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

                                    console.log(`=== Renderizando coluna ${columnId} (${column.title}) com ${tasks.length} tarefas ===`);
                                    return <Column key={column.id} column={{...column, tasks}} />;
                                } catch (colError) {
                                    console.error(`Erro ao renderizar coluna ${columnId}:`, colError);
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