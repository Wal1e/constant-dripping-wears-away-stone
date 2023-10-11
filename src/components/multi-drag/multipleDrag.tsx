import { DndContext, useDroppable, DragOverlay } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import styles from './field-setting.module.scss'
import React, { useMemo, useState, useContext } from 'react'
import { ViewContext } from '../context'
import { Switch } from 'antd'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableItem from '@/components/dnd/draggable/SortableItem'
import DragOverlayItem from '@/components/dnd/draggable/DragOverlayItem'
import { FROZEN_FIELDS, NOT_FROZEN_FIELDS, FIELD_SOURCE_TYPE } from '@/constants/workspace/view'
import { FieldItem, ViewTableColumn } from '../type'
import { useMemoizedFn } from 'ahooks'
import { THiddenFields } from '@/service/workspace/view/type'
import { saveHideFields, saveFreezeFields } from '@/service/workspace/view'
import { useParams } from 'react-router-dom'
import Icon from '@/components/Icon'

const DroppableArea: React.FC<{ id: string; length: number; children: React.ReactNode }> = ({
  id,
  length,
  children
}) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      accepts: [id]
    }
  })

  return (
    <div ref={setNodeRef} className={styles.droppable}>
      <div className={`${styles[id === FROZEN_FIELDS ? 'frozen-title' : 'not-frozen-title']} ${styles['title']}`}>
        {id === FROZEN_FIELDS ? '冻结列' : '非冻结列'}
      </div>
      {length > 0 ? (
        children
      ) : (
        <div className={`${styles['empty-item']} flex-center`}>
          <div className={styles['line']}></div>
          <div className={styles['content']}>暂无数据</div>
          <div className={styles['line']}></div>
        </div>
      )}
    </div>
  )
}
type Items = Record<string, string[]>

const getFieldItems = (fields: FieldItem[]) => {
  const fieldItems: {
    [key: string]: FieldItem[]
  } = {}
  fieldItems[FROZEN_FIELDS] = []
  fieldItems[NOT_FROZEN_FIELDS] = []
  fields.map((field: any) => {
    fieldItems[field.isFrozen ? FROZEN_FIELDS : NOT_FROZEN_FIELDS].push(field)
  })
  return fieldItems
}

const FieldSetting: React.FC<{
  fields: FieldItem[]
  fieldMap: { [id: string]: ViewTableColumn['mapData'] }
  initialItems?: Items
  setFieldsVo(fieldsVo: FieldItem[]): void
}> = ({ fields, fieldMap, setFieldsVo }) => {
  const viewContext = useContext(ViewContext)
  const params = useParams()
  const [activeId, setActiveId] = useState<string>('')
  const [fieldItems, setFieldItems] = useState<{
    [key: string]: FieldItem[]
  }>(() => getFieldItems(fields))

  const handleVisible = useMemoizedFn(async (currentFieldId: string, opt: string) => {
    const tempVo = [...fields]
    tempVo.forEach(item => {
      if (item.fieldId == currentFieldId) {
        item.isHidden = opt === 'hide' ? true : false
      }
    })
    setFieldsVo(tempVo)
    // 保存字段显隐到服务端
    const requestParams: THiddenFields[] = []
    const tempObj = {} as THiddenFields
    tempObj.fieldId = currentFieldId
    requestParams.push(tempObj)
    await saveHideFields(params?.code || '', {
      workItemId: params.viewType || '',
      workViewId: params.viewId || '',
      hiddenFields: requestParams
    })
    viewContext.updateConditions()
  })

  const handleSortAndFreeze = useMemoizedFn(async () => {
    const tempVo: FieldItem[] = []
    const frozenFieldItems = fieldItems[FROZEN_FIELDS]
    const notFrozenFieldItems = fieldItems[NOT_FROZEN_FIELDS]
    const orderFields: THiddenFields[] = []
    const freezeFields: THiddenFields[] = []
    frozenFieldItems.forEach(item => {
      const fieldId = item.fieldId
      item.isFrozen = true
      tempVo.push(item)
      orderFields.push({ fieldId })
      freezeFields.push({ fieldId })
    })
    notFrozenFieldItems.forEach(item => {
      item.isFrozen = false
      tempVo.push(item)
      orderFields.push({ fieldId: item.fieldId })
    })
    setFieldsVo(tempVo)
    // setFieldItems(() => getFieldItems(tempVo))
    // 保存字段冻结到服务端
    await saveFreezeFields(params?.code || '', {
      workItemId: params.viewType || '',
      workViewId: params.viewId || '',
      orderFields,
      freezeFields
    })
    viewContext.updateConditions()
  })

  const containers = useMemo(() => {
    return Object.keys(fieldItems)
  }, [fieldItems])

  const getContainerId = (id: string) => {
    if (containers.indexOf(id) > -1) {
      return id
    }
    return containers.find(containerId => fieldItems[containerId].some(item => item.fieldId === id))
  }

  function handleDragOver(event: any) {
    const { active, over } = event
    const activeId = active?.id
    const overId = over?.id
    if (!overId) {
      return
    }
    if (activeId === overId) {
      return
    }
    const activeContainerId = getContainerId(activeId)
    const overContainerId = getContainerId(overId)
    if (!activeContainerId || !overContainerId) {
      return
    }
    const overItems = fieldItems[overContainerId]
    const activeItems = fieldItems[activeContainerId]
    const activeFieldIds = activeItems.map(fieldItem => fieldItem.fieldId)
    const overIndex = activeFieldIds.indexOf(overId)
    const activeIndex = activeFieldIds.indexOf(activeId)
    if (activeContainerId !== overContainerId) {
      let newIndex: number
      if (containers.indexOf(overId) > -1) {
        if (active?.rect?.current?.translated.top > active?.rect?.current?.initial.top) {
          newIndex = 0
        } else {
          newIndex = overItems.length + 1
        }
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height
        const modifier = isBelowOverItem ? 1 : 0
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
      }

      setFieldItems(items => ({
        ...items,
        [activeContainerId]: activeItems.filter(item => item.fieldId !== activeId),
        [overContainerId]: [
          ...overItems.slice(0, newIndex),
          activeItems[activeIndex],
          ...overItems.slice(newIndex, overItems.length)
        ]
      }))
    }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    const activeId = active?.id
    const overId = over?.id
    setActiveId('')
    if (!overId) {
      setTimeout(() => handleSortAndFreeze(), 10)
      return
    }
    if (activeId === overId) {
      // 在没有跨容器的时候，这里不能发送保存请求，因为后端会认为是变更操作
      // 但是在跨容器的时候，需要发送，上述没有跨容器的情况要做处理
      setTimeout(() => handleSortAndFreeze(), 10)
      return
    }
    const activeContainerId = getContainerId(activeId)
    const overContainerId = getContainerId(overId)
    if (overContainerId && activeContainerId === overContainerId) {
      const overItems = fieldItems[overContainerId]
      const overFieldIds = overItems.map(fieldItem => fieldItem.fieldId)
      const activeIndex = overFieldIds.indexOf(activeId)
      const overIndex = overFieldIds.indexOf(overId)
      // -1表示，碰撞检测算法，当前拖拽的activeItem还没有覆盖真正的item，而是只进入了另一个container
      // if (overIndex === -1) {
      //   if (active?.rect?.current?.translated.top > active?.rect?.current?.initial.top) {
      //     overIndex = 1
      //   } else {
      //     overIndex = overItems.length
      //   }
      // }
      if (overIndex > -1) {
        setFieldItems(items => {
          const overContainerItems = arrayMove(items[overContainerId], activeIndex, overIndex)
          const newItems = {
            ...items,
            [overContainerId]: overContainerItems
          }
          return newItems
        })
      }
      setTimeout(() => handleSortAndFreeze(), 10)
    }
  }

  function handleDragStart(event: any) {
    const { active } = event
    const activeId = active?.id
    setActiveId(activeId)
  }

  const DraggableContent = ({
    item,
    fieldItem,
    activeId,
    idx
  }: {
    item: any
    fieldItem: FieldItem
    activeId?: any
    idx?: number
  }) => {
    const { fieldId, fieldName } = item
    const handleChangeShow = (fieldId: string, checked: boolean) => {
      console.log('handleChangeShow', checked)
      handleVisible(fieldId, checked ? 'show' : 'hide')
    }
    return (
      <div key={idx} className={`${styles['content-container']} flex-justify-between flex-align-center`}>
        <div
          className={`${styles['drag-content']} ${
            activeId === fieldId ? styles['is-disabled'] : ''
          } flex-center mr-4 ml-8`}
        >
          {/* <img key={fieldId} src={fieldItem.icon} width={16} height={16} /> */}
          <Icon key={fieldId} name={fieldItem.icon as string} size={16} local={false}></Icon>
          <div className={`${styles['field-name']} ${activeId === fieldId ? styles['is-disabled'] : ''}`}>
            {fieldName}
          </div>
          {fieldItem.fieldSourceType !== FIELD_SOURCE_TYPE.SELF && (
            <div className={`${styles['field-tag']} ${activeId === fieldId ? styles['is-disabled'] : ''}`}>
              {fieldItem.fieldSourceName}
            </div>
          )}
        </div>
        <Switch
          size="small"
          checked={!fieldItem.isHidden}
          className={styles['switch-visible']}
          key={idx + 'fieldType'}
          disabled={activeId === fieldId || !fieldItem.supportCancelFreeze}
          onClick={checked => {
            handleChangeShow(fieldId, checked)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`${styles['field-setting']}`}>
      {containers.length >= 0 && (
        <div>
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            modifiers={[restrictToVerticalAxis]}
            // collisionDetection={}
          >
            {/* <div className={styles.draggableContainer}>{parent === '' ? item : null}</div> */}
            {containers.map(containerId => (
              <DroppableArea id={containerId} key={containerId} length={fieldItems[containerId]?.length}>
                <SortableContext
                  items={fieldItems[containerId].map(item => item.fieldId)}
                  strategy={rectSortingStrategy}
                >
                  {fieldItems[containerId].map((fieldItem, idx) => {
                    const fieldId = fieldItem.fieldId
                    return (
                      <SortableItem
                        className={`${styles['draggable-item']}`}
                        id={fieldItem.fieldId}
                        key={fieldItem.fieldId}
                      >
                        <DraggableContent
                          item={{ fieldName: fieldMap[fieldId]?.styleData?.name, fieldId }}
                          fieldItem={fieldItem}
                          activeId={activeId}
                          idx={idx}
                        ></DraggableContent>
                      </SortableItem>
                    )
                  })}
                </SortableContext>
              </DroppableArea>
            ))}
            <DragOverlay>
              {activeId && (
                <DragOverlayItem className={`${styles['draggable-overlay']}`} id={activeId} activeId={activeId}>
                  <DraggableContent
                    item={{ fieldName: fieldMap[activeId]?.styleData?.name, fieldId: activeId }}
                    fieldItem={fields.find(fieldItem => fieldItem.fieldId === activeId) as FieldItem}
                    activeId=""
                  ></DraggableContent>
                </DragOverlayItem>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  )
}

export default FieldSetting
