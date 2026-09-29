const BASE = import.meta.env.VITE_APPS_SCRIPT_URL

async function call(params) {
  const res = await fetch(`${BASE}?${new URLSearchParams(params)}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export const listFiles = (day, pageToken = '') => call({ action: 'list', day, pageToken })
export const thumb = (id, w = 400) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`
export const previewUrl = (id) => `https://drive.google.com/file/d/${id}/preview`
export const downloadUrl = (id) => `https://drive.google.com/uc?export=download&id=${id}`

// Apps Script opens a resumable session; the browser then sends the file straight to Drive.
export async function uploadFile(file, day, onProgress) {
  const { url } = await call({
    action: 'session', day, name: file.name,
    type: file.type || 'application/octet-stream', origin: location.origin,
  })
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed')))
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(file)
  })
}

export async function downloadMany(ids) {
  for (const id of ids) {
    const a = document.createElement('a')
    a.href = downloadUrl(id); a.download = ''
    document.body.appendChild(a); a.click(); a.remove()
    await new Promise((r) => setTimeout(r, 700)) // spacing keeps browsers from blocking the batch
  }
}
