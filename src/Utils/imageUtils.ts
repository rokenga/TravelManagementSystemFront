export function logImageOperation(operation: string, stepIndex: number, imageId?: string) {
    console.log(`[ImageOperation] ${operation}: step=${stepIndex}${imageId ? `, imageId=${imageId}` : ""}`)
  }
  