<script setup>
import { zoom, zoomIdentity } from 'd3-zoom'
import { pointer, select } from 'd3-selection'
import { onMounted, ref, computed, watch } from 'vue'
import { useKeyPress } from '../../composables/useKeyPress'
import { useVueFlow } from '../../composables/useVueFlow'
import { useResizeHandler } from '../../composables/useResizeHandler'
import { clamp, isMacOs, warn } from '../../utils'
import Pane from '../Pane/Pane.vue'
import Transform from './Transform.vue'

// Définition locale de PanOnScrollMode au lieu de l'importer
const PanOnScrollMode = {
  Free: 'free',
  Vertical: 'vertical',
  Horizontal: 'horizontal',
}

const {
  minZoom,
  maxZoom,
  defaultViewport,
  translateExtent,
  zoomActivationKeyCode,
  selectionKeyCode,
  panActivationKeyCode,
  panOnScroll,
  panOnScrollMode,
  panOnScrollSpeed,
  panOnDrag,
  zoomOnDoubleClick,
  zoomOnPinch,
  zoomOnScroll,
  preventScrolling,
  noWheelClassName,
  noPanClassName,
  emits,
  connectionStartHandle,
  userSelectionActive,
  paneDragging,
  d3Zoom: storeD3Zoom,
  d3Selection: storeD3Selection,
  d3ZoomHandler: storeD3ZoomHandler,
  viewport,
  viewportRef,
  paneClickDistance,
} = useVueFlow()

useResizeHandler(viewportRef)

const isZoomingOrPanning = ref(false)

const isPanScrolling = ref(false)

let panScrollTimeout = null

let zoomedWithRightMouseButton = false

let mouseButton = 0

let prevTransform = {
  x: 0,
  y: 0,
  zoom: 0,
}

const panKeyPressed = useKeyPress(panActivationKeyCode)

const selectionKeyPressed = useKeyPress(selectionKeyCode)

const zoomKeyPressed = useKeyPress(zoomActivationKeyCode)

const shouldPanOnDrag = computed(
  () =>
    (!selectionKeyPressed.value ||
      (selectionKeyPressed.value && selectionKeyCode.value === true)) &&
    (panKeyPressed.value || panOnDrag.value)
)

const shouldPanOnScroll = computed(
  () => panKeyPressed.value || panOnScroll.value
)

const isSelecting = computed(
  () =>
    selectionKeyPressed.value ||
    (selectionKeyCode.value === true && shouldPanOnDrag.value !== true)
)

onMounted(() => {
  if (!viewportRef.value) {
    warn('Viewport element is missing')
    return
  }

  const viewportElement = viewportRef.value

  const bbox = viewportElement.getBoundingClientRect()

  const d3Zoom = zoom()
    .clickDistance(paneClickDistance.value)
    .scaleExtent([minZoom.value, maxZoom.value])
    .translateExtent(translateExtent.value)
  const d3Selection = select(viewportElement).call(d3Zoom)
  const d3ZoomHandler = d3Selection.on('wheel.zoom')

  const updatedTransform = zoomIdentity
    .translate(defaultViewport.value.x ?? 0, defaultViewport.value.y ?? 0)
    .scale(clamp(defaultViewport.value.zoom ?? 1, minZoom.value, maxZoom.value))

  const extent = [
    [0, 0],
    [bbox.width, bbox.height],
  ]

  const constrainedTransform = d3Zoom.constrain()(
    updatedTransform,
    extent,
    translateExtent.value
  )
  d3Zoom.transform(d3Selection, constrainedTransform)
  d3Zoom.wheelDelta(wheelDelta)

  storeD3Zoom.value = d3Zoom
  storeD3Selection.value = d3Selection
  storeD3ZoomHandler.value = d3ZoomHandler

  viewport.value = {
    x: constrainedTransform.x,
    y: constrainedTransform.y,
    zoom: constrainedTransform.k,
  }

  d3Zoom.on('start', (event) => {
    if (!event.sourceEvent) {
      return null
    }

    // we need to remember it here, because it's always 0 in the "zoom" event
    mouseButton = event.sourceEvent.button

    isZoomingOrPanning.value = true

    const flowTransform = eventToFlowTransform(event.transform)

    if (event.sourceEvent?.type === 'mousedown') {
      paneDragging.value = true
    }

    prevTransform = flowTransform

    emits.viewportChangeStart(flowTransform)
    emits.moveStart({ event, flowTransform })
  })

  d3Zoom.on('end', (event) => {
    if (!event.sourceEvent) {
      return null
    }

    isZoomingOrPanning.value = false

    paneDragging.value = false

    if (
      isRightClickPan(shouldPanOnDrag.value, mouseButton ?? 0) &&
      !zoomedWithRightMouseButton
    ) {
      emits.paneContextMenu(event.sourceEvent)
    }

    zoomedWithRightMouseButton = false

    if (viewChanged(prevTransform, event.transform)) {
      const flowTransform = eventToFlowTransform(event.transform)

      prevTransform = flowTransform

      emits.viewportChangeEnd(flowTransform)
      emits.moveEnd({ event, flowTransform })
    }
  })

  d3Zoom.filter((event) => {
    const zoomScroll = zoomKeyPressed.value || zoomOnScroll.value
    const pinchZoom = zoomOnPinch.value && event.ctrlKey
    const eventButton = event.button

    if (
      eventButton === 1 &&
      event.type === 'mousedown' &&
      (isWrappedWithClass(event, 'vue-flow__node') ||
        isWrappedWithClass(event, 'vue-flow__edge'))
    ) {
      return true
    }

    // if all interactions are disabled, we prevent all zoom events
    if (
      !shouldPanOnDrag.value &&
      !zoomScroll &&
      !shouldPanOnScroll.value &&
      !zoomOnDoubleClick.value &&
      !zoomOnPinch.value
    ) {
      return false
    }

    // during a selection we prevent all other interactions
    if (userSelectionActive.value) {
      return false
    }

    // if zoom on double click is disabled, we prevent the double click event
    if (!zoomOnDoubleClick.value && event.type === 'dblclick') {
      return false
    }

    // if the target element is inside an element with the nowheel class, we prevent zooming
    if (
      isWrappedWithClass(event, noWheelClassName.value) &&
      event.type === 'wheel'
    ) {
      return false
    }

    // if the target element is inside an element with the nopan class, we prevent panning
    if (
      isWrappedWithClass(event, noPanClassName.value) &&
      (event.type !== 'wheel' ||
        (shouldPanOnScroll.value &&
          event.type === 'wheel' &&
          !zoomKeyPressed.value))
    ) {
      return false
    }

    if (!zoomOnPinch.value && event.ctrlKey && event.type === 'wheel') {
      return false
    }

    // when there is no scroll handling enabled, we prevent all wheel events
    if (
      !zoomScroll &&
      !shouldPanOnScroll.value &&
      !pinchZoom &&
      event.type === 'wheel'
    ) {
      return false
    }

    // prevent zooming on mobile when using pinch and zoomOnPinch is disabled
    if (
      !zoomOnPinch &&
      event.type === 'touchstart' &&
      event.touches?.length > 1
    ) {
      event.preventDefault() // if you manage to start with 2 touches, we prevent native zoom
      return false
    }

    // if the pane is not movable, we prevent dragging it with mousestart or touchstart
    if (
      !shouldPanOnDrag.value &&
      (event.type === 'mousedown' || event.type === 'touchstart')
    ) {
      return false
    }

    // if selection key code is true and panOnDrag tries to use left mouse button we prevent it
    if (
      selectionKeyCode.value === true &&
      Array.isArray(panOnDrag.value) &&
      panOnDrag.value.includes(0) &&
      eventButton === 0
    ) {
      return false
    }

    // if the pane is only movable using allowed clicks
    if (
      Array.isArray(panOnDrag.value) &&
      !panOnDrag.value.includes(eventButton) &&
      (event.type === 'mousedown' || event.type === 'touchstart')
    ) {
      return false
    }

    // We only allow right clicks if pan on drag is set to right-click
    const buttonAllowed =
      (Array.isArray(panOnDrag.value) &&
        panOnDrag.value.includes(eventButton)) ||
      (selectionKeyCode.value === true &&
        Array.isArray(panOnDrag.value) &&
        !panOnDrag.value.includes(0)) ||
      !eventButton ||
      eventButton <= 1

    // default filter for d3-zoom
    return (
      (!event.ctrlKey || panKeyPressed.value || event.type === 'wheel') &&
      buttonAllowed
    )
  })

  watch(
    [userSelectionActive, shouldPanOnDrag],
    () => {
      if (userSelectionActive.value && !isZoomingOrPanning.value) {
        d3Zoom.on('zoom', null)
      } else if (!userSelectionActive.value) {
        d3Zoom.on('zoom', (event) => {
          viewport.value = {
            x: event.transform.x,
            y: event.transform.y,
            zoom: event.transform.k,
          }

          const flowTransform = eventToFlowTransform(event.transform)

          zoomedWithRightMouseButton = isRightClickPan(
            shouldPanOnDrag.value,
            mouseButton ?? 0
          )

          emits.viewportChange(flowTransform)
          emits.move({ event, flowTransform })
        })
      }
    },
    { immediate: true }
  )

  watch(
    [
      userSelectionActive,
      shouldPanOnScroll,
      panOnScrollMode,
      zoomKeyPressed,
      zoomOnPinch,
      preventScrolling,
      noWheelClassName,
    ],
    () => {
      if (
        shouldPanOnScroll.value &&
        !zoomKeyPressed.value &&
        !userSelectionActive.value
      ) {
        d3Selection.on(
          'wheel.zoom',
          (event) => {
            if (isWrappedWithClass(event, noWheelClassName.value)) {
              return false
            }

            const zoomScroll = zoomKeyPressed.value || zoomOnScroll.value
            const pinchZoom = zoomOnPinch.value && event.ctrlKey

            const scrollEventEnabled =
              !preventScrolling.value ||
              shouldPanOnScroll.value ||
              zoomScroll ||
              pinchZoom

            if (!scrollEventEnabled) {
              return false
            }
            event.preventDefault()
            event.stopImmediatePropagation()

            const currentZoom = d3Selection.property('__zoom').k || 1
            const _isMacOs = isMacOs()

            // macOS sets ctrlKey=true for pinch gesture on a trackpad
            if (
              !panKeyPressed.value &&
              event.ctrlKey &&
              zoomOnPinch.value &&
              _isMacOs
            ) {
              const point = pointer(event)
              const pinchDelta = wheelDelta(event)
              const zoom = currentZoom * 2 ** pinchDelta
              // d3-zoom types are not up to date
              d3Zoom.scaleTo(d3Selection, zoom, point, event)

              return
            }

            // increase scroll speed in firefox
            // firefox: deltaMode === 1; chrome: deltaMode === 0
            const deltaNormalize = event.deltaMode === 1 ? 20 : 1

            let deltaX =
              panOnScrollMode.value === PanOnScrollMode.Vertical
                ? 0
                : event.deltaX * deltaNormalize
            let deltaY =
              panOnScrollMode.value === PanOnScrollMode.Horizontal
                ? 0
                : event.deltaY * deltaNormalize

            // this enables vertical scrolling with shift + scroll on windows
            if (
              !_isMacOs &&
              event.shiftKey &&
              panOnScrollMode.value !== PanOnScrollMode.Vertical &&
              !deltaX &&
              deltaY
            ) {
              deltaX = deltaY
              deltaY = 0
            }

            d3Zoom.translateBy(
              d3Selection,
              -(deltaX / currentZoom) * panOnScrollSpeed.value,
              -(deltaY / currentZoom) * panOnScrollSpeed.value
            )

            const nextViewport = eventToFlowTransform(
              d3Selection.property('__zoom')
            )

            if (panScrollTimeout) {
              clearTimeout(panScrollTimeout)
            }

            // for pan on scroll we need to handle the event calls on our own
            // we can't use the start, zoom and end events from d3-zoom
            // because start and move gets called on every scroll event and not once at the beginning
            if (!isPanScrolling.value) {
              isPanScrolling.value = true

              emits.moveStart({ event, flowTransform: nextViewport })
              emits.viewportChangeStart(nextViewport)
            } else {
              emits.move({ event, flowTransform: nextViewport })
              emits.viewportChange(nextViewport)

              panScrollTimeout = setTimeout(() => {
                emits.moveEnd({ event, flowTransform: nextViewport })
                emits.viewportChangeEnd(nextViewport)

                isPanScrolling.value = false
              }, 150)
            }
          },
          { passive: false }
        )
      } else if (typeof d3ZoomHandler !== 'undefined') {
        d3Selection.on(
          'wheel.zoom',
          function (event, d) {
            // we still want to enable pinch zooming even if preventScrolling is set to false
            const invalidEvent =
              !preventScrolling.value &&
              event.type === 'wheel' &&
              !event.ctrlKey

            const zoomScroll = zoomKeyPressed.value || zoomOnScroll.value
            const pinchZoom = zoomOnPinch.value && event.ctrlKey

            const scrollEventsDisabled =
              !zoomScroll &&
              !panOnScroll.value &&
              !pinchZoom &&
              event.type === 'wheel'

            if (
              scrollEventsDisabled ||
              invalidEvent ||
              isWrappedWithClass(event, noWheelClassName.value)
            ) {
              return null
            }

            event.preventDefault()
            d3ZoomHandler.call(this, event, d)
          },
          { passive: false }
        )
      }
    },
    { immediate: true }
  )
})

function isRightClickPan(pan, usedButton) {
  return usedButton === 2 && Array.isArray(pan) && pan.includes(2)
}

function wheelDelta(event) {
  const factor = event.ctrlKey && isMacOs() ? 10 : 1

  return (
    -event.deltaY *
    (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
    factor
  )
}

function viewChanged(prevViewport, eventTransform) {
  return (
    (prevViewport.x !== eventTransform.x && !Number.isNaN(eventTransform.x)) ||
    (prevViewport.y !== eventTransform.y && !Number.isNaN(eventTransform.y)) ||
    (prevViewport.zoom !== eventTransform.k && !Number.isNaN(eventTransform.k))
  )
}

function eventToFlowTransform(eventTransform) {
  return {
    x: eventTransform.x,
    y: eventTransform.y,
    zoom: eventTransform.k,
  }
}

function isWrappedWithClass(event, className) {
  return event.target.closest(`.${className}`)
}
</script>

<script>
export default {
  name: 'Viewport',
  compatConfig: { MODE: 3 },
}
</script>

<template>
  <div ref="viewportRef" class="vue-flow__viewport vue-flow__container">
    <Pane
      :is-selecting="isSelecting"
      :selection-key-pressed="selectionKeyPressed"
      :class="{
        connecting: !!connectionStartHandle,
        dragging: paneDragging,
        draggable:
          panOnDrag === true ||
          (Array.isArray(panOnDrag) && panOnDrag.includes(0)),
      }"
    >
      <Transform>
        <slot />
      </Transform>
    </Pane>
  </div>
</template>
