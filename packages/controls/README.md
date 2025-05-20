# Vue Flow: Controls Component

This is a control component for Vue Flow.
It can be used to control the canvas interactions, like zooming in, zooming out, fitting the view and locking interactions.

## 🛠 Setup

```bash
# install
$ yarn add @vue2-flow/controls

# or
$ npm i --save @vue2-flow/controls
```

## 🎮 Quickstart

```vue
<script setup>
import { VueFlow } from "@vue2-flow/core"
import { Controls } from "@vue2-flow/controls"

// import default controls styles
import "@vue-flow/controls/dist/style.css"

import initialElements from "./initial-elements"

// some nodes and edges
const elements = ref(initialElements)
</script>

<template>
  <VueFlow v-model="elements" fit-view-on-init class="vue-flow-basic-example">
    <Controls />
  </VueFlow>
</template>
```
