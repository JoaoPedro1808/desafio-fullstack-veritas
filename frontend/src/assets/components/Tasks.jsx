import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import './Task.css';

export default function Task({ task, index }) {
  
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          style={provided.draggableProps.style}
        >
          <div className="task-title">{task.nome || 'Sem nome'}</div>

          {task.fullTask && task.fullTask.desc && (
            <div className="task-description">{task.fullTask.desc}</div>
          )}
        </div>
      )}
    </Draggable>
  );
}