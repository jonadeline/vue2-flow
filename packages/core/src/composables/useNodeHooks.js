import { createExtendedEventHook } from '../utils'

function createNodeHooks() {
  return {
    doubleClick: createExtendedEventHook(),
    click: createExtendedEventHook(),
    mouseEnter: createExtendedEventHook(),
    mouseMove: createExtendedEventHook(),
    mouseLeave: createExtendedEventHook(),
    contextMenu: createExtendedEventHook(),
    dragStart: createExtendedEventHook(),
    drag: createExtendedEventHook(),
    dragStop: createExtendedEventHook(),
  }
}

/**
 * Composable for handling node events
 *
 * @internal
 */
export function useNodeHooks(node, emits) {
  const nodeHooks = createNodeHooks()

  nodeHooks.doubleClick.on((event) => {
    emits.nodeDoubleClick(event)
    node.events?.doubleClick?.(event)
  })

  nodeHooks.click.on((event) => {
    emits.nodeClick(event)
    node.events?.click?.(event)
  })

  nodeHooks.mouseEnter.on((event) => {
    emits.nodeMouseEnter(event)
    node.events?.mouseEnter?.(event)
  })

  nodeHooks.mouseMove.on((event) => {
    emits.nodeMouseMove(event)
    node.events?.mouseMove?.(event)
  })

  nodeHooks.mouseLeave.on((event) => {
    emits.nodeMouseLeave(event)
    node.events?.mouseLeave?.(event)
  })

  nodeHooks.contextMenu.on((event) => {
    emits.nodeContextMenu(event)
    node.events?.contextMenu?.(event)
  })

  nodeHooks.dragStart.on((event) => {
    emits.nodeDragStart(event)
    node.events?.dragStart?.(event)
  })

  nodeHooks.drag.on((event) => {
    emits.nodeDrag(event)
    node.events?.drag?.(event)
  })

  nodeHooks.dragStop.on((event) => {
    emits.nodeDragStop(event)
    node.events?.dragStop?.(event)
  })

  return Object.entries(nodeHooks).reduce(
    (hooks, [key, value]) => {
      hooks.emit[key] = value.trigger
      hooks.on[key] = value.on
      return hooks
    },
    { emit: {}, on: {} }
  )
}
