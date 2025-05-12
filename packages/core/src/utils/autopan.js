import { clamp } from './graph'

// returns a number between 0 and 1 that represents the velocity of the movement
// when the mouse is close to the edge of the canvas
function calcAutoPanVelocity(value, min, max) {
  if (value < min) {
    return clamp(Math.abs(value - min), 1, min) / min
  }

  if (value > max) {
    return -clamp(Math.abs(value - max), 1, min) / min
  }

  return 0
}

export function calcAutoPan(pos, bounds, speed = 15, distance = 40) {
  const xMovement =
    calcAutoPanVelocity(pos.x, distance, bounds.width - distance) * speed
  const yMovement =
    calcAutoPanVelocity(pos.y, distance, bounds.height - distance) * speed

  return [xMovement, yMovement]
}
