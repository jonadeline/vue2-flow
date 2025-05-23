<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDrag, useUpdateNodePositions, useVueFlow } from '../../composables'
import { arrowKeyDiffs, getRectOfNodes } from '../../utils'

const {
  emits,
  viewport,
  getSelectedNodes,
  noPanClassName,
  disableKeyboardA11y,
  userSelectionActive,
} = useVueFlow()

const updatePositions = useUpdateNodePositions()

const el = ref(null)

const dragging = useDrag({
  el,
  onStart(args) {
    emits.selectionDragStart(args)
  },
  onDrag(args) {
    emits.selectionDrag(args)
  },
  onStop(args) {
    emits.selectionDragStop(args)
  },
})

onMounted(() => {
  if (!disableKeyboardA11y.value) {
    el.value?.focus({ preventScroll: true })
  }
})

const selectedNodesBBox = computed(() => getRectOfNodes(getSelectedNodes.value))

const innerStyle = computed(() => ({
  width: `${selectedNodesBBox.value.width}px`,
  height: `${selectedNodesBBox.value.height}px`,
  top: `${selectedNodesBBox.value.y}px`,
  left: `${selectedNodesBBox.value.x}px`,
}))

function onContextMenu(event) {
  emits.selectionContextMenu({ event, nodes: getSelectedNodes.value })
}

function onKeyDown(event) {
  if (disableKeyboardA11y) {
    return
  }

  if (arrowKeyDiffs[event.key]) {
    event.preventDefault()

    updatePositions(
      {
        x: arrowKeyDiffs[event.key].x,
        y: arrowKeyDiffs[event.key].y,
      },
      event.shiftKey
    )
  }
}
</script>

<script>
export default {
  name: 'NodesSelection',
  compatConfig: { MODE: 3 },
}
</script>

<template>
  <div
    v-if="
      !userSelectionActive &&
      selectedNodesBBox.width &&
      selectedNodesBBox.height
    "
    class="vue-flow__nodesselection vue-flow__container"
    :class="noPanClassName"
    :style="{
      transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})`,
    }"
  >
    <div
      ref="el"
      :class="{ dragging }"
      class="vue-flow__nodesselection-rect"
      :style="innerStyle"
      :tabIndex="disableKeyboardA11y ? undefined : -1"
      @contextmenu="onContextMenu"
      @keydown="onKeyDown"
    />
  </div>
</template>
