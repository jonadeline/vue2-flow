<script setup>
import { computed } from 'vue'
import { useVueFlow } from '../../composables'

const { viewport, fitViewOnInit, fitViewOnInitDone } = useVueFlow()

const isHidden = computed(() => {
  if (fitViewOnInit.value) {
    return !fitViewOnInitDone.value
  }

  return false
})

const transform = computed(
  () =>
    `translate(${viewport.value.x}px,${viewport.value.y}px) scale(${viewport.value.zoom})`
)
</script>

<script>
export default {
  name: 'Transform',
  compatConfig: { MODE: 3 },
}
</script>

<template>
  <div
    class="vue-flow__transformationpane vue-flow__container"
    :style="{ transform, opacity: isHidden ? 0 : undefined }"
  >
    <slot />
  </div>
</template>
