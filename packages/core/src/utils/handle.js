import {
  getEventPosition,
  getHandlePosition,
  getOverlappingArea,
  nodeToRect,
} from '.'

// Définitions locales des enums au lieu de les importer
const ConnectionMode = {
  Strict: 'strict',
  Loose: 'loose',
}

const Position = {
  Top: 'top',
  Right: 'right',
  Bottom: 'bottom',
  Left: 'left',
}

const alwaysValid = () => true

export function resetRecentHandle(handleDomNode) {
  handleDomNode?.classList.remove(
    'valid',
    'connecting',
    'vue-flow__handle-valid',
    'vue-flow__handle-connecting'
  )
}

// this functions collects all handles and adds an absolute position
// so that we can later find the closest handle to the mouse position
export function getHandles(node, handleBounds, type, currentHandle) {
  const connectionHandles = []

  for (const handle of handleBounds[type] || []) {
    if (`${node.id}-${handle.id}-${type}` !== currentHandle) {
      const { x, y } = getHandlePosition(node, handle)

      connectionHandles.push({
        id: handle.id || null,
        type,
        nodeId: node.id,
        x,
        y,
      })
    }
  }

  return connectionHandles
}

function getNodesWithinDistance(position, nodeLookup, distance) {
  const nodes = []
  const rect = {
    x: position.x - distance,
    y: position.y - distance,
    width: distance * 2,
    height: distance * 2,
  }

  for (const node of nodeLookup.values()) {
    if (getOverlappingArea(rect, nodeToRect(node)) > 0) {
      nodes.push(node)
    }
  }

  return nodes
}

// this distance is used for the area around the user pointer
// while doing a connection for finding the closest nodes
const ADDITIONAL_DISTANCE = 250

export function getClosestHandle(
  position,
  connectionRadius,
  nodeLookup,
  fromHandle
) {
  let closestHandles = []
  let minDistance = Number.POSITIVE_INFINITY

  const closeNodes = getNodesWithinDistance(
    position,
    nodeLookup,
    connectionRadius + ADDITIONAL_DISTANCE
  )

  for (const node of closeNodes) {
    const allHandles = [
      ...(node.handleBounds?.source ?? []),
      ...(node.handleBounds?.target ?? []),
    ]

    for (const handle of allHandles) {
      // if the handle is the same as the fromHandle we skip it
      if (
        fromHandle.nodeId === handle.nodeId &&
        fromHandle.type === handle.type &&
        fromHandle.id === handle.id
      ) {
        continue
      }

      // determine absolute position of the handle
      const { x, y } = getHandlePosition(node, handle, handle.position, true)

      const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2)
      if (distance > connectionRadius) {
        continue
      }

      if (distance < minDistance) {
        closestHandles = [{ ...handle, x, y }]
        minDistance = distance
      } else if (distance === minDistance) {
        // when multiple handles are on the same distance we collect all of them
        closestHandles.push({ ...handle, x, y })
      }
    }
  }

  if (!closestHandles.length) {
    return null
  }

  // when multiple handles overlay each other we prefer the opposite handle
  if (closestHandles.length > 1) {
    const oppositeHandleType =
      fromHandle.type === 'source' ? 'target' : 'source'
    return (
      closestHandles.find((handle) => handle.type === oppositeHandleType) ??
      closestHandles[0]
    )
  }

  return closestHandles[0]
}

// checks if and returns connection in form of an object { source: 123, target: 312 }
export function isValidHandle(
  event,
  {
    handle,
    connectionMode,
    fromNodeId,
    fromHandleId,
    fromType,
    doc,
    lib,
    flowId,
    isValidConnection = alwaysValid,
  },
  edges,
  nodes,
  findNode
) {
  const isTarget = fromType === 'target'
  const handleDomNode = handle
    ? doc.querySelector(
        `.${lib}-flow__handle[data-id="${flowId}-${handle?.nodeId}-${handle?.id}-${handle?.type}"]`
      )
    : null

  const { x, y } = getEventPosition(event)
  const handleBelow = doc.elementFromPoint(x, y)
  // we always want to prioritize the handle below the mouse cursor over the closest distance handle,
  // because it could be that the center of another handle is closer to the mouse pointer than the handle below the cursor
  const handleToCheck = handleBelow?.classList.contains(`${lib}-flow__handle`)
    ? handleBelow
    : handleDomNode

  const result = {
    handleDomNode: handleToCheck,
    isValid: false,
    connection: null,
    toHandle: null,
  }

  if (handleToCheck) {
    const handleType = getHandleType(undefined, handleToCheck)
    const handleNodeId = handleToCheck.getAttribute('data-nodeid')
    const handleId = handleToCheck.getAttribute('data-handleid')
    const connectable = handleToCheck.classList.contains('connectable')
    const connectableEnd = handleToCheck.classList.contains('connectableend')

    if (!handleNodeId || !handleType) {
      return result
    }

    const connection = {
      source: isTarget ? handleNodeId : fromNodeId,
      sourceHandle: isTarget ? handleId : fromHandleId,
      target: isTarget ? fromNodeId : handleNodeId,
      targetHandle: isTarget ? fromHandleId : handleId,
    }

    result.connection = connection

    const isConnectable = connectable && connectableEnd
    // in strict mode we don't allow target to target or source to source connections
    const isValid =
      isConnectable &&
      (connectionMode === ConnectionMode.Strict
        ? (isTarget && handleType === 'source') ||
          (!isTarget && handleType === 'target')
        : handleNodeId !== fromNodeId || handleId !== fromHandleId)

    result.isValid =
      isValid &&
      isValidConnection(connection, {
        nodes,
        edges,
        sourceNode: findNode(fromNodeId),
        targetNode: findNode(handleNodeId),
      })

    result.toHandle = handle
  }

  return result
}

export function getHandleType(edgeUpdaterType, handleDomNode) {
  if (edgeUpdaterType) {
    return edgeUpdaterType
  } else if (handleDomNode?.classList.contains('target')) {
    return 'target'
  } else if (handleDomNode?.classList.contains('source')) {
    return 'source'
  }

  return null
}

export function getConnectionStatus(isInsideConnectionRadius, isHandleValid) {
  let connectionStatus = null

  if (isHandleValid) {
    connectionStatus = 'valid'
  } else if (isInsideConnectionRadius && !isHandleValid) {
    connectionStatus = 'invalid'
  }

  return connectionStatus
}

export function isConnectionValid(isInsideConnectionRadius, isHandleValid) {
  let isValid = null

  if (isHandleValid) {
    isValid = true
  } else if (isInsideConnectionRadius && !isHandleValid) {
    isValid = false
  }

  return isValid
}

export function getHandle(
  nodeId,
  handleType,
  handleId,
  nodeLookup,
  connectionMode,
  withAbsolutePosition = false
) {
  const node = nodeLookup.get(nodeId)
  if (!node) {
    return null
  }

  const handles =
    connectionMode === ConnectionMode.Strict
      ? node.handleBounds?.[handleType]
      : [
          ...(node.handleBounds?.source ?? []),
          ...(node.handleBounds?.target ?? []),
        ]
  const handle =
    (handleId ? handles?.find((h) => h.id === handleId) : handles?.[0]) ?? null

  return handle && withAbsolutePosition
    ? { ...handle, ...getHandlePosition(node, handle, handle.position, true) }
    : handle
}

export const oppositePosition = {
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
}
