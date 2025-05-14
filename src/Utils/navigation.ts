
export function triggerNavigationGuard(callback: () => void) {
    const event = new Event("menu-navigation", { cancelable: true })
    const cancelled = !window.dispatchEvent(event)
  
    if (!cancelled) {
      callback()
    }
  }
  
  