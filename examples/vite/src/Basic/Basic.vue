<script>
import { ref } from "vue"
import { VueFlow, useVueFlow } from "@vue2-flow/core"
import { Background } from "@vue2-flow/background"
import { Controls } from "@vue2-flow/controls"

export default {
  components: {
    VueFlow,
    Background,
    Controls,
  },
  setup() {
    const nodesDraggable = ref(false)
    const zoomOnScroll = ref(false)
    const panOnScroll = ref(true)
    const zoomOnDoubleClick = ref(false)

    const nodes = ref([
      {
        id: "1",
        type: "input",
        data: { label: "Node 1" },
        position: { x: 250, y: 0 },
        class: "light",
      },
      {
        id: "2",
        type: "output",
        data: { label: "Node 2" },
        position: { x: 100, y: 100 },
        class: "light",
      },
      {
        id: "3",
        data: { label: "Node 3" },
        position: { x: 400, y: 100 },
        class: "light",
      },
      {
        id: "4",
        data: { label: "Node 4" },
        position: { x: 150, y: 200 },
        class: "light",
      },
      {
        id: "5",
        type: "output",
        data: { label: "Node 5" },
        position: { x: 300, y: 300 },
        class: "light",
      },
    ])

    const edges = ref([
      {
        id: "e1-2",
        source: "1",
        target: "2",
        animated: true,
      },
      {
        id: "e1-3",
        source: "1",
        target: "3",
        label: "edge with arrowhead",
      },
      {
        id: "e4-5",
        type: "step",
        source: "4",
        target: "5",
        label: "Node 2",
        labelBgStyle: { fill: "orange" },
      },
      {
        id: "e3-4",
        type: "smoothstep",
        source: "3",
        target: "4",
        label: "smoothstep-edge",
      },
    ])

    const { onConnect, addEdges } = useVueFlow()
    onConnect((connection) => {
      addEdges(connection)
    })

    return {
      nodes,
      edges,
      nodesDraggable,
      zoomOnScroll,
      panOnScroll,
      zoomOnDoubleClick,
    }
  },
}
</script>

<template>
  <VueFlow
    class="basic-flow"
    :nodes="nodes"
    :edges="edges"
    :zoom-on-scroll="zoomOnScroll"
    :nodes-draggable="nodesDraggable"
    :zoom-on-drag="zoomOnScroll"
    :pan-on-scroll="panOnScroll"
    :zoom-on-double-click="zoomOnDoubleClick"
    :min-zoom="0.8"
    :max-zoom="1"
    fit-view-on-init
  >
    <Controls :show-interactive="false" />
    <Background pattern-color="#ededed" :size="3" :gap="15" />
  </VueFlow>
</template>
