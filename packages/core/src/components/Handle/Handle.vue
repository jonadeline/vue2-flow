<script setup>
import { computed, onMounted, ref } from 'vue'
import { useHandle, useNode, useVueFlow } from '../../composables'
import { getDimensions, isDef, isMouseEvent } from '../../utils'

const props = defineProps({
  position: {
    type: String,
    default: () => 'top',
  },
  connectable: {
    type: [Boolean, String, Number, Function],
    default: undefined,
  },
  connectableStart: {
    type: Boolean,
    default: true,
  },
  connectableEnd: {
    type: Boolean,
    default: true,
  },
  id: {
    type: [String, Number],
    default: null,
  },
  type: {
    type: String,
    default: 'source',
  },
  isValidConnection: {
    type: Function,
    default: null,
  },
})

const handleId = computed(() => props.id)
const position = computed(() => props.position)

const type = computed(() => props.type ?? 'source')

const isValidConnection = computed(() => props.isValidConnection ?? null)

const {
  id: flowId,
  connectionStartHandle,
  connectionClickStartHandle,
  connectionEndHandle,
  vueFlowRef,
  nodesConnectable,
  noDragClassName,
  noPanClassName,
} = useVueFlow()

const { id: nodeId, node, nodeEl, connectedEdges } = useNode()

const handle = ref()

const isConnectableStart = computed(() =>
  typeof props.connectableStart !== 'undefined' ? props.connectableStart : true
)

const isConnectableEnd = computed(() =>
  typeof props.connectableEnd !== 'undefined' ? props.connectableEnd : true
)

const isConnecting = computed(
  () =>
    (connectionStartHandle.value?.nodeId === nodeId &&
      connectionStartHandle.value?.id === handleId.value &&
      connectionStartHandle.value?.type === type.value) ||
    (connectionEndHandle.value?.nodeId === nodeId &&
      connectionEndHandle.value?.id === handleId.value &&
      connectionEndHandle.value?.type === type.value)
)

const isClickConnecting = computed(
  () =>
    connectionClickStartHandle.value?.nodeId === nodeId &&
    connectionClickStartHandle.value?.id === handleId.value &&
    connectionClickStartHandle.value?.type === type.value
)

const { handlePointerDown, handleClick } = useHandle({
  nodeId,
  handleId,
  isValidConnection,
  type,
})

const isConnectable = computed(() => {
  if (typeof props.connectable === 'string' && props.connectable === 'single') {
    return !connectedEdges.value.some((edge) => {
      const id = edge[`${type.value}Handle`]

      if (edge[type.value] !== nodeId) {
        return false
      }

      return id ? id === handleId.value : true
    })
  }

  if (typeof props.connectable === 'number') {
    return (
      connectedEdges.value.filter((edge) => {
        const id = edge[`${type.value}Handle`]

        if (edge[type.value] !== nodeId) {
          return false
        }

        return id ? id === handleId.value : true
      }).length < props.connectable
    )
  }

  if (typeof props.connectable === 'function') {
    return props.connectable(node, connectedEdges.value)
  }

  return isDef(props.connectable) ? props.connectable : nodesConnectable.value
})

// todo: remove this and have users handle this themselves using `updateNodeInternals`
// set up handle bounds if they don't exist yet and the node has been initialized (i.e. the handle was added after the node has already been mounted)
onMounted(() => {
  // if the node isn't initialized yet, we can't set up the handle bounds
  // the handle bounds will be automatically set up when the node is initialized (`updateNodeDimensions`)
  if (!node.dimensions.width || !node.dimensions.height) {
    return
  }

  const existingBounds = node.handleBounds[type.value]?.find(
    (b) => b.id === handleId.value
  )

  if (!vueFlowRef.value || existingBounds) {
    return
  }

  const viewportNode = vueFlowRef.value.querySelector(
    '.vue-flow__transformationpane'
  )

  if (!nodeEl.value || !handle.value || !viewportNode || !handleId.value) {
    return
  }

  const nodeBounds = nodeEl.value.getBoundingClientRect()

  const handleBounds = handle.value.getBoundingClientRect()

  const style = window.getComputedStyle(viewportNode)
  const { m22: zoom } = new window.DOMMatrixReadOnly(style.transform)

  const nextBounds = {
    id: handleId.value,
    position: position.value,
    x: (handleBounds.left - nodeBounds.left) / zoom,
    y: (handleBounds.top - nodeBounds.top) / zoom,
    type: type.value,
    nodeId,
    ...getDimensions(handle.value),
  }

  node.handleBounds[type.value] = [
    ...(node.handleBounds[type.value] ?? []),
    nextBounds,
  ]
})

function onPointerDown(event) {
  const isMouseTriggered = isMouseEvent(event)

  if (
    isConnectable.value &&
    isConnectableStart.value &&
    ((isMouseTriggered && event.button === 0) || !isMouseTriggered)
  ) {
    handlePointerDown(event)
  }
}

function onClick(event) {
  if (
    !nodeId ||
    (!connectionClickStartHandle.value && !isConnectableStart.value)
  ) {
    return
  }

  if (isConnectable.value) {
    handleClick(event)
  }
}

defineExpose({
  handleClick,
  handlePointerDown,
  onClick,
  onPointerDown,
})
</script>

<script>
export default {
  name: 'Handle',
  compatConfig: { MODE: 3 },
}
</script>

<template>
  <div
    ref="handle"
    :data-id="`${flowId}-${nodeId}-${handleId}-${type}`"
    :data-handleid="handleId"
    :data-nodeid="nodeId"
    :data-handlepos="position"
    class="vue-flow__handle"
    :class="[
      `vue-flow__handle-${position}`,
      `vue-flow__handle-${handleId}`,
      noDragClassName,
      noPanClassName,
      type,
      {
        connectable: isConnectable,
        connecting: isClickConnecting,
        connectablestart: isConnectableStart,
        connectableend: isConnectableEnd,
        connectionindicator:
          isConnectable &&
          ((isConnectableStart && !isConnecting) ||
            (isConnectableEnd && isConnecting)),
      },
    ]"
    @mousedown="onPointerDown"
    @touchstart.passive="onPointerDown"
    @click="onClick"
  >
    <slot :id="id" />
  </div>
</template>
