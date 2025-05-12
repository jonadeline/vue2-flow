import {
  getEventPosition,
  isUseDragEvent,
  pointToRendererPoint,
  snapPosition,
} from '../utils'
import { useVueFlow } from './useVueFlow'

/**
 * Composable that returns a function to get the pointer position
 *
 * @internal
 */
export function useGetPointerPosition() {
  const { viewport, snapGrid, snapToGrid } = useVueFlow({})

  // returns the pointer position projected to the VF coordinate system
  return (event) => {
    const evt = isUseDragEvent(event) ? event.sourceEvent : event

    const { x, y } = getEventPosition(evt)
    const pointerPos = pointToRendererPoint({ x, y }, viewport.value)
    const { x: xSnapped, y: ySnapped } = snapToGrid.value
      ? snapPosition(pointerPos, snapGrid.value)
      : pointerPos

    // we need the snapped position in order to be able to skip unnecessary drag events
    return {
      xSnapped,
      ySnapped,
      ...pointerPos,
    }
  }
}
