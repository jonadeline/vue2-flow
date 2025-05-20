<template>
  <button class="vue-flow__controls-button" @click="onClick">
    <slot />
  </button>
</template>

<script>
import { defineComponent } from "vue"

export default defineComponent({
  name: "ControlButton",
  emits: ["click"],
  setup(_, { emit }) {
    function onClick(event) {
      emit("click", event)
    }

    return {
      onClick,
    }
  },
})
</script>
