<script setup>
import { computed } from 'vue'
import { useVueFlow } from '../../composables'
import { getMarkerId } from '../../utils'
import MarkerSymbols from './MarkerSymbols.vue'

const {
  id: vueFlowId,
  edges,
  connectionLineOptions,
  defaultMarkerColor: defaultColor,
} = useVueFlow()

const markers = computed(() => {
  const ids = new Set()
  const markers = []

  const createMarkers = (marker) => {
    if (marker) {
      const markerId = getMarkerId(marker, vueFlowId)

      if (!ids.has(markerId)) {
        if (typeof marker === 'object') {
          markers.push({
            ...marker,
            id: markerId,
            color: marker.color || defaultColor.value,
          })
        } else {
          markers.push({
            id: markerId,
            color: defaultColor.value,
            type: marker,
          })
        }

        ids.add(markerId)
      }
    }
  }

  for (const marker of [
    connectionLineOptions.value.markerEnd,
    connectionLineOptions.value.markerStart,
  ]) {
    createMarkers(marker)
  }

  for (const edge of edges.value) {
    for (const marker of [edge.markerStart, edge.markerEnd]) {
      createMarkers(marker)
    }
  }

  return markers.sort((a, b) => a.id.localeCompare(b.id))
})
</script>

<script>
export default {
  name: 'MarkerDefinitions',
  compatConfig: { MODE: 3 },
}
</script>

<template>
  <svg class="vue-flow__marker vue-flow__container">
    <defs>
      <MarkerSymbols
        v-for="marker of markers"
        :id="marker.id"
        :key="marker.id"
        :type="marker.type"
        :color="marker.color"
        :width="marker.width"
        :height="marker.height"
        :markerUnits="marker.markerUnits"
        :stroke-width="marker.strokeWidth"
        :orient="marker.orient"
      />
    </defs>
  </svg>
</template>
