<script setup>
defineProps({
  userSelectionRect: {
    type: Object,
    required: true,
  },
})
</script>

<script>
export default {
  name: 'UserSelection',
  compatConfig: { MODE: 3 },
}
</script>

<template>
  <div
    class="vue-flow__selection vue-flow__container"
    :style="{
      width: `${userSelectionRect.width}px`,
      height: `${userSelectionRect.height}px`,
      transform: `translate(${userSelectionRect.x}px, ${userSelectionRect.y}px)`,
    }"
  />
</template>
