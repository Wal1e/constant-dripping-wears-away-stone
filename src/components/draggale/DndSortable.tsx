import React, { useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

const DraggableItem = ({ id, index, children }: any) => {
  const { attributes, listeners, setNodeRef, transform, setActivatorNodeRef } = useSortable({ id })

  const style = {
    display: 'flex',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div ref={setActivatorNodeRef} {...listeners} style={{ cursor: 'grab', userSelect: 'none' }}>
        Drag Handle
      </div>
      <div style={{ userSelect: 'none' }}>{children}</div>
    </div>
  )
}

const DraggableList = ({ data }: any) => {
  const [items, setItems] = useState(data)

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item: { idx: any }) => item.idx === active.id)
      const newIndex = items.findIndex((item: { idx: any }) => item.idx === over.id)

      const newItems = [...items]
      newItems.splice(oldIndex, 1)
      newItems.splice(newIndex, 0, items[oldIndex])

      setItems(newItems)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
      <SortableContext items={items.map((item: any) => item.idx)} strategy={rectSortingStrategy}>
        {items.map(
          (
            item: {
              idx: React.Key | null | undefined
              content: any
            },
            index: any
          ) => (
            <DraggableItem key={item.idx} id={item.idx} index={index}>
              <div>{item.content}</div>
            </DraggableItem>
          )
        )}
      </SortableContext>
    </DndContext>
  )
}

const App = () => {
  const data = [
    { idx: 'aa', content: 'Item 1' },
    { idx: 'bb', content: 'Item 2' },
    { idx: 'cc', content: 'Item 3' }
    // ...
  ]

  return <DraggableList data={data} />
}

export default App
