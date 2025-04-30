import { createExtendedEventHook } from '../utils'

function createEdgeHooks() {
  return {
    doubleClick: createExtendedEventHook(),
    click: createExtendedEventHook(),
    mouseEnter: createExtendedEventHook(),
    mouseMove: createExtendedEventHook(),
    mouseLeave: createExtendedEventHook(),
    contextMenu: createExtendedEventHook(),
    updateStart: createExtendedEventHook(),
    update: createExtendedEventHook(),
    updateEnd: createExtendedEventHook(),
  }
}

/**
 * Composable for handling edge events
 *
 * @internal
 */
export function useEdgeHooks(edge, emits) {
  const edgeHooks = createEdgeHooks()

  edgeHooks.doubleClick.on((event) => {
    emits.edgeDoubleClick(event)
    edge.events?.doubleClick?.(event)
  })

  edgeHooks.click.on((event) => {
    emits.edgeClick(event)
    edge.events?.click?.(event)
  })

  edgeHooks.mouseEnter.on((event) => {
    emits.edgeMouseEnter(event)
    edge.events?.mouseEnter?.(event)
  })

  edgeHooks.mouseMove.on((event) => {
    emits.edgeMouseMove(event)
    edge.events?.mouseMove?.(event)
  })

  edgeHooks.mouseLeave.on((event) => {
    emits.edgeMouseLeave(event)
    edge.events?.mouseLeave?.(event)
  })

  edgeHooks.contextMenu.on((event) => {
    emits.edgeContextMenu(event)
    edge.events?.contextMenu?.(event)
  })

  edgeHooks.updateStart.on((event) => {
    emits.edgeUpdateStart(event)
    edge.events?.updateStart?.(event)
  })

  edgeHooks.update.on((event) => {
    emits.edgeUpdate(event)
    edge.events?.update?.(event)
  })

  edgeHooks.updateEnd.on((event) => {
    emits.edgeUpdateEnd(event)
    edge.events?.updateEnd?.(event)
  })

  return Object.entries(edgeHooks).reduce(
    (hooks, [key, value]) => {
      hooks.emit[key] = value.trigger
      hooks.on[key] = value.on

      return hooks
    },
    { emit: {}, on: {} }
  )
}
