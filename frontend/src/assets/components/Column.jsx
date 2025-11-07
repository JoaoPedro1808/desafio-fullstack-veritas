import React from "react";
import { Droppable } from "react-beautiful-dnd";
import Task from "./Tasks";
import "./Column.css";

export default function Column({column}) {
    if (!column) {
        return null;
    }

    const tasks = column.tasks || [];

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
                        {tasks.length > 0 ? (
                            tasks.map((task, taskIndex) => (
                                task ? <Task key={task.id} task={task} index={taskIndex} /> : null
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
        </div>
    );
}