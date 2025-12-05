/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  api: {
    toggleAlwaysOnTop: (isAlwaysOnTop: boolean) => void
    toggleMaximizeWindow: (maximize: boolean) => void
    minimizeWindow: () => void
    closeWindow: () => void
  }
}
