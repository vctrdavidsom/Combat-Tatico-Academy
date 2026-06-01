export const normalizeGoogleDriveDownloadUrl = (value: string) => {
  if (!value) return value

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (host !== "drive.google.com" && host !== "docs.google.com") {
      return value
    }

    const idFromQuery = url.searchParams.get("id")
    if (idFromQuery) {
      return `https://drive.google.com/uc?export=download&id=${idFromQuery}`
    }

    const matchFile = url.pathname.match(/\/file\/d\/([^/]+)/)
    if (matchFile?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${matchFile[1]}`
    }

    const matchDoc = url.pathname.match(/\/d\/([^/]+)/)
    if (matchDoc?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${matchDoc[1]}`
    }
  } catch {
    return value
  }

  return value
}
