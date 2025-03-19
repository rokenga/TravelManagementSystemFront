/**
 * Utility function to trigger navigation confirmation for menu items
 * Call this function in the onClick handler of menu items
 */
export function triggerNavigationGuard(callback: () => void) {
    // Create and dispatch a custom event
    const event = new Event("menu-navigation", { cancelable: true })
    const cancelled = !window.dispatchEvent(event)
  
    // If the event wasn't cancelled (by our navigation guard), execute the callback
    if (!cancelled) {
      callback()
    }
  }
  
  