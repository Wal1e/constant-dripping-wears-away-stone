import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const DraggableItem = ({ item, index }: any) => {
  return (
    <Draggable draggableId={item.id} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            userSelect: 'none',
            padding: '8px',
            margin: '0 0 8px 0',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            ...provided.draggableProps.style
          }}
        >
          {item.content}
        </div>
      )}
    </Draggable>
  )
}

const DraggableList = ({ data }: any) => {
  return (
    <Droppable droppableId="droppable" direction="vertical">
      {provided => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {data.map((item: { id: React.Key | null | undefined }, index: any) => (
            <DraggableItem key={item.id} item={item} index={index} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

const Drag = () => {
  const [data, setData] = useState([
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' },
    { id: '3', content: 'Item 3' }
    // ...
  ])

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return
    }

    const newItems = Array.from(data)
    const [movedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, movedItem)

    setData(newItems)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <DraggableList data={data} />
    </DragDropContext>
  )
}

export default Drag
