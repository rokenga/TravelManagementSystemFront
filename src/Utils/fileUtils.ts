export function uniquifyFiles(files: File[]): File[] {
    return files.map((f) => {
      const ext = f.name.includes(".") ? f.name.substring(f.name.lastIndexOf(".")) : ""
      const base = f.name.replace(ext, "")
      const unique = `${base}-${crypto.randomUUID().slice(0, 8)}${ext}`
      return new File([f], unique, { type: f.type })
    })
  }
  