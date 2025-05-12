import { unref } from 'vue'
import {
  ErrorCode,
  VueFlowError,
  connectionExists,
  getEdgeId,
  isEdge,
  isNode,
  parseEdge,
  parseNode,
} from '.'

export function isDef(val) {
  const unrefVal = unref(val)

  return typeof unrefVal !== 'undefined'
}

export function addEdgeToStore(
  edgeParams,
  edges,
  triggerError,
  defaultEdgeOptions
) {
  if (!edgeParams || !edgeParams.source || !edgeParams.target) {
    triggerError(
      new VueFlowError(ErrorCode.EDGE_INVALID, edgeParams?.id ?? `[ID UNKNOWN]`)
    )
    return false
  }

  let edge
  if (isEdge(edgeParams)) {
    edge = edgeParams
  } else {
    edge = {
      ...edgeParams,
      id: getEdgeId(edgeParams),
    }
  }

  edge = parseEdge(edge, undefined, defaultEdgeOptions)

  if (connectionExists(edge, edges)) {
    return false
  }

  return edge
}

export function updateEdgeAction(
  edge,
  newConnection,
  prevEdge,
  shouldReplaceId,
  triggerError
) {
  if (!newConnection.source || !newConnection.target) {
    triggerError(new VueFlowError(ErrorCode.EDGE_INVALID, edge.id))
    return false
  }

  if (!prevEdge) {
    triggerError(new VueFlowError(ErrorCode.EDGE_NOT_FOUND, edge.id))
    return false
  }

  const { id, ...rest } = edge

  return {
    ...rest,
    id: shouldReplaceId ? getEdgeId(newConnection) : id,
    source: newConnection.source,
    target: newConnection.target,
    sourceHandle: newConnection.sourceHandle,
    targetHandle: newConnection.targetHandle,
  }
}

export function createGraphNodes(nodes, findNode, triggerError) {
  const parentNodes = {}

  const nextNodes = []
  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]

    if (!isNode(node)) {
      triggerError(
        new VueFlowError(ErrorCode.NODE_INVALID, node?.id) ||
          `[ID UNKNOWN|INDEX ${i}]`
      )
      continue
    }

    const parsed = parseNode(node, findNode(node.id), node.parentNode)

    if (node.parentNode) {
      parentNodes[node.parentNode] = true
    }

    nextNodes[i] = parsed
  }

  for (const node of nextNodes) {
    const parentNode =
      findNode(node.parentNode) ||
      nextNodes.find((n) => n.id === node.parentNode)

    if (node.parentNode && !parentNode) {
      triggerError(
        new VueFlowError(
          ErrorCode.NODE_MISSING_PARENT,
          node.id,
          node.parentNode
        )
      )
    }

    if (node.parentNode || parentNodes[node.id]) {
      if (parentNodes[node.id]) {
        node.isParent = true
      }

      if (parentNode) {
        parentNode.isParent = true
      }
    }
  }

  return nextNodes
}

/**
 * this function adds the connection to the connectionLookup
 * at the following keys: nodeId-type-handleId, nodeId-type and nodeId
 * @param type type of the connection
 * @param connection connection that should be added to the lookup
 * @param connectionKey at which key the connection should be added
 * @param connectionLookup reference to the connection lookup
 * @param nodeId nodeId of the connection
 * @param handleId handleId of the conneciton
 */
function addConnectionToLookup(
  type,
  connection,
  connectionKey,
  connectionLookup,
  nodeId,
  handleId
) {
  // We add the connection to the connectionLookup at the following keys
  // 1. nodeId, 2. nodeId-type, 3. nodeId-type-handleId
  // If the key already exists, we add the connection to the existing map
  let key = nodeId
  const nodeMap = connectionLookup.get(key) || new Map()
  connectionLookup.set(key, nodeMap.set(connectionKey, connection))

  key = `${nodeId}-${type}`
  const typeMap = connectionLookup.get(key) || new Map()
  connectionLookup.set(key, typeMap.set(connectionKey, connection))

  if (handleId) {
    key = `${nodeId}-${type}-${handleId}`
    const handleMap = connectionLookup.get(key) || new Map()
    connectionLookup.set(key, handleMap.set(connectionKey, connection))
  }
}

export function updateConnectionLookup(connectionLookup, edgeLookup, edges) {
  connectionLookup.clear()

  for (const edge of edges) {
    const {
      source: sourceNode,
      target: targetNode,
      sourceHandle = null,
      targetHandle = null,
    } = edge

    const connection = {
      edgeId: edge.id,
      source: sourceNode,
      target: targetNode,
      sourceHandle,
      targetHandle,
    }
    const sourceKey = `${sourceNode}-${sourceHandle}--${targetNode}-${targetHandle}`
    const targetKey = `${targetNode}-${targetHandle}--${sourceNode}-${sourceHandle}`

    addConnectionToLookup(
      'source',
      connection,
      targetKey,
      connectionLookup,
      sourceNode,
      sourceHandle
    )
    addConnectionToLookup(
      'target',
      connection,
      sourceKey,
      connectionLookup,
      targetNode,
      targetHandle
    )
  }
}

/**
 * We call the callback for all connections in a that are not in b
 *
 * @internal
 */
export function handleConnectionChange(a, b, cb) {
  if (!cb) {
    return
  }

  const diff = []

  for (const key of a.keys()) {
    if (!b.has(key)) {
      diff.push(a.get(key))
    }
  }

  if (diff.length) {
    cb(diff)
  }
}

/**
 * @internal
 */
export function areConnectionMapsEqual(a, b) {
  if (!a && !b) {
    return true
  }

  if (!a || !b || a.size !== b.size) {
    return false
  }

  if (!a.size && !b.size) {
    return true
  }

  for (const key of a.keys()) {
    if (!b.has(key)) {
      return false
    }
  }

  return true
}

/**
 * @internal
 */
export function areSetsEqual(a, b) {
  if (a.size !== b.size) {
    return false
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false
    }
  }

  return true
}

/**
 * @internal
 */
export function createGraphEdges(
  nextEdges,
  isValidConnection,
  findNode,
  findEdge,
  onError,
  defaultEdgeOptions,
  nodes,
  edges
) {
  const validEdges = []

  for (const edgeOrConnection of nextEdges) {
    const edge = isEdge(edgeOrConnection)
      ? edgeOrConnection
      : addEdgeToStore(edgeOrConnection, edges, onError, defaultEdgeOptions)

    if (!edge) {
      continue
    }

    const sourceNode = findNode(edge.source)
    const targetNode = findNode(edge.target)

    if (!sourceNode || !targetNode) {
      onError(
        new VueFlowError(
          ErrorCode.EDGE_SOURCE_TARGET_MISSING,
          edge.id,
          edge.source,
          edge.target
        )
      )
      continue
    }

    if (!sourceNode) {
      onError(
        new VueFlowError(ErrorCode.EDGE_SOURCE_MISSING, edge.id, edge.source)
      )
      continue
    }

    if (!targetNode) {
      onError(
        new VueFlowError(ErrorCode.EDGE_TARGET_MISSING, edge.id, edge.target)
      )
      continue
    }

    if (isValidConnection) {
      const isValid = isValidConnection(edge, {
        edges,
        nodes,
        sourceNode,
        targetNode,
      })

      if (!isValid) {
        onError(new VueFlowError(ErrorCode.EDGE_INVALID, edge.id))
        continue
      }
    }

    const existingEdge = findEdge(edge.id)

    validEdges.push({
      ...parseEdge(edge, existingEdge, defaultEdgeOptions),
      sourceNode,
      targetNode,
    })
  }

  return validEdges
}
