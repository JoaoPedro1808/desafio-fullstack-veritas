import React from "react";
import { Droppable } from "react-beautiful-dnd";
import Task from "./Tasks";
import "./Column.css";

export default function Column({column, onCreateTask, onDeleteTask}) {
    if (!column || !column.id) {
        console.warn("column undefined")
        return null;
    }

    const tasks = Array.isArray(column.tasks) ? column.tasks : [];

    const valid = tasks.filter(task =>
        task && task.id && task.db_id
    )

    console.log(`Column ${column.id}:`, {
        totaltasks: tasks.length,
        validtask: valid.length,
        taskIds: valid.map(t => t.id)
    })

    const handleAddTask = () => {
        const nome = prompt("Nova tarefa");

        if (nome && nome.trim() != "") {
            onCreateTask(nome.trim());
        }
    };

    return (
        <div className="column-container">
            <h2 className="column-header">{column.title || "Sem título"}</h2>
            <Droppable droppableId={String(column.id)}>
                {(provided, snapshot) => (
                    <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    style={{
                        backgroundColor: snapshot.isDraggingOver ? "#e3f2fd" : "#f9f9f9",
                    }}>
                        {valid.length > 0 ? (
                            tasks.map((task, index) => (
                                task ? <Task key={task.id} task={task} index={index} onDeleteTask={() => onDeleteTask(task.db_id)}/> : null
                            ))
                        ) : (
                            <div className="empty-task-message">
                                Nenhuma tarefa
                            </div>
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            {column.title == "A Fazer" && (
            <button className="addtask" onClick={handleAddTask}>
                Adicionar nova tarefa
            </button>
            )}
        </div>
    );
}