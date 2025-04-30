// Define ErrorCode as an object with constants instead of an enum
export const ErrorCode = {
  MISSING_STYLES: 'MISSING_STYLES',
  MISSING_VIEWPORT_DIMENSIONS: 'MISSING_VIEWPORT_DIMENSIONS',
  NODE_INVALID: 'NODE_INVALID',
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_MISSING_PARENT: 'NODE_MISSING_PARENT',
  NODE_TYPE_MISSING: 'NODE_TYPE_MISSING',
  NODE_EXTENT_INVALID: 'NODE_EXTENT_INVALID',
  EDGE_INVALID: 'EDGE_INVALID',
  EDGE_NOT_FOUND: 'EDGE_NOT_FOUND',
  EDGE_SOURCE_MISSING: 'EDGE_SOURCE_MISSING',
  EDGE_TARGET_MISSING: 'EDGE_TARGET_MISSING',
  EDGE_TYPE_MISSING: 'EDGE_TYPE_MISSING',
  EDGE_SOURCE_TARGET_SAME: 'EDGE_SOURCE_TARGET_SAME',
  EDGE_SOURCE_TARGET_MISSING: 'EDGE_SOURCE_TARGET_MISSING',
  EDGE_ORPHANED: 'EDGE_ORPHANED',

  // deprecation errors
  USEVUEFLOW_OPTIONS: 'USEVUEFLOW_OPTIONS',
}

const messages = {
  [ErrorCode.MISSING_STYLES]: () =>
    `It seems that you haven't loaded the necessary styles. Please import '@vue-flow/core/dist/style.css' to ensure that the graph is rendered correctly`,
  [ErrorCode.MISSING_VIEWPORT_DIMENSIONS]: () =>
    'The Vue Flow parent container needs a width and a height to render the graph',
  [ErrorCode.NODE_INVALID]: (id) => `Node is invalid\nNode: ${id}`,
  [ErrorCode.NODE_NOT_FOUND]: (id) => `Node not found\nNode: ${id}`,
  [ErrorCode.NODE_MISSING_PARENT]: (id, parentId) =>
    `Node is missing a parent\nNode: ${id}\nParent: ${parentId}`,
  [ErrorCode.NODE_TYPE_MISSING]: (type) =>
    `Node type is missing\nType: ${type}`,
  [ErrorCode.NODE_EXTENT_INVALID]: (id) =>
    `Only child nodes can use a parent extent\nNode: ${id}`,
  [ErrorCode.EDGE_INVALID]: (id) =>
    `An edge needs a source and a target\nEdge: ${id}`,
  [ErrorCode.EDGE_SOURCE_MISSING]: (id, source) =>
    `Edge source is missing\nEdge: ${id} \nSource: ${source}`,
  [ErrorCode.EDGE_TARGET_MISSING]: (id, target) =>
    `Edge target is missing\nEdge: ${id} \nTarget: ${target}`,
  [ErrorCode.EDGE_TYPE_MISSING]: (type) =>
    `Edge type is missing\nType: ${type}`,
  [ErrorCode.EDGE_SOURCE_TARGET_SAME]: (id, source, target) =>
    `Edge source and target are the same\nEdge: ${id} \nSource: ${source} \nTarget: ${target}`,
  [ErrorCode.EDGE_SOURCE_TARGET_MISSING]: (id, source, target) =>
    `Edge source or target is missing\nEdge: ${id} \nSource: ${source} \nTarget: ${target}`,
  [ErrorCode.EDGE_ORPHANED]: (id) =>
    `Edge was orphaned (suddenly missing source or target) and has been removed\nEdge: ${id}`,
  [ErrorCode.EDGE_NOT_FOUND]: (id) => `Edge not found\nEdge: ${id}`,

  // deprecation errors
  [ErrorCode.USEVUEFLOW_OPTIONS]: () =>
    `The options parameter is deprecated and will be removed in the next major version. Please use the id parameter instead`,
}

export class VueFlowError extends Error {
  constructor(code, ...args) {
    super(messages[code]?.(...args))
    this.name = 'VueFlowError'
    this.code = code
    this.args = args
  }
}

export function isErrorOfType(error, code) {
  return error.code === code
}
