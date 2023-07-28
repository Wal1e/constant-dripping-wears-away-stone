import React, { useState } from 'react'
import { DndContext, useDroppable, useDraggable } from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

function Droppable(props: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id
  })
  const style = {
    color: isOver ? 'green' : undefined
  }

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  )
}

function Draggable(props: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id
  })
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </div>
  )
}

function DndDemo() {
  const [parent, setParent] = useState(null)
  const [containers, setContainers] = useState(['A', 'B', 'C'])
  const draggableMarkup = <Draggable id="draggable">Drag me</Draggable>

  function handleDragEnd(event: any) {
    const { over } = event
    setContainers(['B', 'A', 'C'])
    // If the item is dropped over a container, set it as the parent
    // otherwise reset the parent to `null`
    setParent(over ? over.id : null)
  }

  return (
    <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
      {/* {parent === null ? draggableMarkup : null} */}

      {containers.map(id => (
        // We updated the Droppable component so it would accept an `id`
        // prop and pass it to `useDroppable`
        <Draggable key={id} id={`draggable${id}`}>
          Drag me{id}
        </Draggable>
      ))}

      {/* {containers.map(id => (
        // We updated the Droppable component so it would accept an `id`
        // prop and pass it to `useDroppable`
        <Droppable key={id} id={id}>
          {parent === id ? draggableMarkup : 'Drop here'}
        </Droppable>
      ))} */}
    </DndContext>
  )
}

export default DndDemo
