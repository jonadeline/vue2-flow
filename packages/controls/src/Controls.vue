<script>
import { defineComponent, toRef, computed, watch } from "vue"
import { Panel, useVueFlow } from "@vue2-flow/core"
import ControlButton from "./ControlButton.vue"
import PlusIcon from "./icons/plus.svg"
import MinusIcon from "./icons/minus.svg"
import FitView from "./icons/fitview.svg"
import Lock from "./icons/lock.svg"
import Unlock from "./icons/unlock.svg"

export default defineComponent({
  name: "Controls",
  components: {
    Panel,
    ControlButton,
  },
  props: {
    showZoom: {
      type: Boolean,
      default: true,
    },
    showFitView: {
      type: Boolean,
      default: true,
    },
    showInteractive: {
      type: Boolean,
      default: true,
    },
    fitViewParams: {
      type: Object,
      default: undefined,
    },
    position: {
      type: String,
      default: "bottom-left",
      validator(value) {
        return [
          "top-left",
          "top-right",
          "top-center",
          "bottom-left",
          "bottom-right",
          "bottom-center",
        ].includes(value)
      },
    },
  },
  emits: ["zoomIn", "zoomOut", "fitView", "interactionChange"],
  setup(props, { emit }) {
    const {
      nodesDraggable,
      nodesConnectable,
      elementsSelectable,
      setInteractive,
      zoomIn,
      zoomOut,
      fitView,
      viewport,
      minZoom,
      maxZoom,
    } = useVueFlow()

    const isInteractive = toRef(
      () =>
        nodesDraggable.value ||
        nodesConnectable.value ||
        elementsSelectable.value
    )

    const minZoomReached = computed(() => {
      const result =
        viewport.value && minZoom.value !== undefined
          ? viewport.value.zoom <= minZoom.value
          : false

      return result
    })

    const maxZoomReached = computed(() => {
      const result =
        viewport.value && maxZoom.value !== undefined
          ? viewport.value.zoom >= maxZoom.value
          : false

      return result
    })

    function onZoomInHandler() {
      zoomIn()
      emit("zoomIn")
    }

    function onZoomOutHandler() {
      zoomOut()
      emit("zoomOut")
    }

    function onFitViewHandler() {
      fitView(props.fitViewParams)
      emit("fitView")
    }

    function onInteractiveChangeHandler() {
      setInteractive(!isInteractive.value)
      emit("interactionChange", !isInteractive.value)
    }

    return {
      nodesDraggable,
      nodesConnectable,
      elementsSelectable,
      setInteractive,
      zoomIn,
      zoomOut,
      fitView,
      viewport,
      minZoom,
      maxZoom,
      isInteractive,
      minZoomReached,
      maxZoomReached,
      onZoomInHandler,
      onZoomOutHandler,
      onFitViewHandler,
      onInteractiveChangeHandler,
      PlusIcon,
      MinusIcon,
      FitView,
      Lock,
      Unlock,
    }
  },
})
</script>

<template>
  <Panel class="vue-flow__controls" :position="position">
    <slot name="top" />

    <template v-if="showZoom">
      <slot name="control-zoom-in">
        <ControlButton
          class="vue-flow__controls-zoomin"
          :disabled="maxZoomReached"
          @click="onZoomInHandler"
        >
          <slot name="icon-zoom-in">
            <component :is="PlusIcon" />
          </slot>
        </ControlButton>
      </slot>

      <slot name="control-zoom-out">
        <ControlButton
          class="vue-flow__controls-zoomout"
          :disabled="minZoomReached"
          @click="onZoomOutHandler"
        >
          <slot name="icon-zoom-out">
            <component :is="MinusIcon" />
          </slot>
        </ControlButton>
      </slot>
    </template>

    <template v-if="showFitView">
      <slot name="control-fit-view">
        <ControlButton
          class="vue-flow__controls-fitview"
          @click="onFitViewHandler"
        >
          <slot name="icon-fit-view">
            <component :is="FitView" />
          </slot>
        </ControlButton>
      </slot>
    </template>

    <template v-if="showInteractive">
      <slot name="control-interactive">
        <ControlButton
          v-if="showInteractive"
          class="vue-flow__controls-interactive"
          @click="onInteractiveChangeHandler"
        >
          <slot v-if="isInteractive" name="icon-unlock">
            <component :is="Unlock" />
          </slot>
          <slot v-if="!isInteractive" name="icon-lock">
            <component :is="Lock" />
          </slot>
        </ControlButton>
      </slot>
    </template>

    <slot />
  </Panel>
</template>
