import React, { useState } from 'react'
import { DndContext, useDndContext, useDraggable } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

const DraggableContainer = ({ id, children }: any) => {
  const [activeId, setActiveId] = useState(id)
  const { setNodeRef, transform } = useDraggable({
    id: activeId
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  )
}

const DraggableItem = ({ content }: any) => {
  return <div style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '4px' }}>{content}</div>
}

const App = () => {
  const data = ['Item 1', 'Item 2', 'Item 3', 'Item 4']

  return (
    <DndContext modifiers={[restrictToVerticalAxis]}>
      {data.map((item, index) => (
        // <DraggableItem key={index} content={item} />
        <DraggableContainer key={index} id={index}>
          <DraggableItem content={item} />
        </DraggableContainer>
      ))}
    </DndContext>
  )
}

export default App
