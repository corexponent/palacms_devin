export type DragContext = {
        element: HTMLElement | null
        data: any
}

const DRAG_MIME = 'application/x-palacms-dnd'

let activeDrag: DragContext | null = null

function setDragData(event: DragEvent, data: any) {
        if (!event.dataTransfer) return
        try {
                event.dataTransfer.setData(DRAG_MIME, JSON.stringify({ hasData: true }))
        } catch {
                // Ignore failures (e.g. Firefox with non-stringifiable data)
        }
        event.dataTransfer.effectAllowed = 'move'
}

export function draggable({
        element,
        dragHandle,
        getInitialData,
        onDragStart,
        onDrop
}: {
        element: HTMLElement
        dragHandle?: HTMLElement | null
        getInitialData?: () => any
        onDragStart?: (args: { event: DragEvent; data: any }) => void
        onDrop?: (args: { event: DragEvent; data: any }) => void
}) {
        if (!element) return

        element.setAttribute('draggable', 'true')

        const handleDragStart = (event: DragEvent) => {
                if (dragHandle && event.target instanceof Node && !dragHandle.contains(event.target)) {
                        event.preventDefault()
                        event.stopPropagation()
                        return
                }

                const data = getInitialData ? getInitialData() : {}
                activeDrag = { element, data }
                setDragData(event, data)
                onDragStart?.({ event, data })
        }

        const handleDragEnd = (event: DragEvent) => {
                if (onDrop) {
                        onDrop({ event, data: activeDrag?.data })
                }
                activeDrag = null
        }

        element.addEventListener('dragstart', handleDragStart)
        element.addEventListener('dragend', handleDragEnd)

        return () => {
                element.removeEventListener('dragstart', handleDragStart)
                element.removeEventListener('dragend', handleDragEnd)
                element.removeAttribute('draggable')
        }
}

function computeSelfData(element: HTMLElement, event: DragEvent, getData?: (args: { element: HTMLElement; input: DragEvent }) => any) {
        if (!getData) return {}
        return getData({ element, input: event })
}

function canDropFor(
        element: HTMLElement,
        event: DragEvent,
        getData: ((args: { element: HTMLElement; input: DragEvent }) => any) | undefined,
        canDrop?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => boolean
) {
        if (!activeDrag) return false
        const data = computeSelfData(element, event, getData)
        const self = { element, data }
        if (canDrop) {
                return canDrop({ event, self, source: activeDrag })
        }
        return true
}

export function dropTargetForElements({
        element,
        getData,
        onDrag,
        onDrop,
        onDragLeave,
        onDragEnter,
        onDragStart,
        onDragEnd,
        canDrop
}: {
        element: HTMLElement
        getData?: (args: { element: HTMLElement; input: DragEvent }) => any
        onDrag?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => void
        onDrop?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => void
        onDragLeave?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => void
        onDragEnter?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => void
        onDragStart?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => void
        onDragEnd?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => void
        canDrop?: (args: { event: DragEvent; self: { element: HTMLElement; data: any }; source: DragContext }) => boolean
}) {
        if (!element) {
                return { destroy: () => {} }
        }

        let isActive = false

        const getSelf = (event: DragEvent) => {
                const data = computeSelfData(element, event, getData)
                return { element, data }
        }

        const start = (event: DragEvent) => {
                if (!activeDrag) return false
                if (isActive) return true
                const self = getSelf(event)
                if (canDrop && !canDrop({ event, self, source: activeDrag })) {
                        return false
                }
                isActive = true
                onDragStart?.({ event, self, source: activeDrag })
                onDragEnter?.({ event, self, source: activeDrag })
                return true
        }

        const end = (event: DragEvent) => {
                if (!activeDrag || !isActive) return
                const self = getSelf(event)
                onDragLeave?.({ event, self, source: activeDrag })
                onDragEnd?.({ event, self, source: activeDrag })
                isActive = false
        }

        const handleDragEnter = (event: DragEvent) => {
                if (!activeDrag) return
                if (!start(event)) return
        }

        const handleDragOver = (event: DragEvent) => {
                if (!activeDrag) return
                const self = getSelf(event)
                const allow = canDrop ? canDrop({ event, self, source: activeDrag }) : true
                if (!allow) return
                event.preventDefault()
                if (!isActive) {
                        isActive = true
                        onDragStart?.({ event, self, source: activeDrag })
                        onDragEnter?.({ event, self, source: activeDrag })
                }
                onDrag?.({ event, self, source: activeDrag })
        }

        const handleDragLeave = (event: DragEvent) => {
                if (!activeDrag || !isActive) return
                end(event)
        }

        const handleDrop = (event: DragEvent) => {
                if (!activeDrag) return
                const self = getSelf(event)
                const allow = canDrop ? canDrop({ event, self, source: activeDrag }) : true
                if (!allow) return
                event.preventDefault()
                onDrop?.({ event, self, source: activeDrag })
                end(event)
        }

        element.addEventListener('dragenter', handleDragEnter)
        element.addEventListener('dragover', handleDragOver)
        element.addEventListener('dragleave', handleDragLeave)
        element.addEventListener('drop', handleDrop)

        return {
                destroy() {
                        element.removeEventListener('dragenter', handleDragEnter)
                        element.removeEventListener('dragover', handleDragOver)
                        element.removeEventListener('dragleave', handleDragLeave)
                        element.removeEventListener('drop', handleDrop)
                }
        }
}

type Edge = 'top' | 'bottom' | 'left' | 'right'

export function attachClosestEdge<T extends Record<string, any>>(
        data: T,
        {
                element,
                input,
                allowedEdges = ['top', 'bottom']
        }: {
                element: HTMLElement
                input: DragEvent
                allowedEdges?: Edge[]
        }
): T & { closestEdge: Edge | null } {
        if (!allowedEdges.length) {
                return { ...data, closestEdge: null }
        }

        const rect = element.getBoundingClientRect()
        const distances: Record<Edge, number> = {
                top: Math.abs(input.clientY - rect.top),
                bottom: Math.abs(input.clientY - rect.bottom),
                left: Math.abs(input.clientX - rect.left),
                right: Math.abs(input.clientX - rect.right)
        }

        let closest: Edge | null = null
        let min = Number.POSITIVE_INFINITY
        for (const edge of allowedEdges) {
                const distance = distances[edge]
                if (distance < min) {
                        min = distance
                        closest = edge
                }
        }

        return { ...data, closestEdge: closest }
}

export function extractClosestEdge(data: { closestEdge?: Edge | null } | null | undefined): Edge | null {
        if (!data) return null
        return (data.closestEdge ?? null) as Edge | null
}
