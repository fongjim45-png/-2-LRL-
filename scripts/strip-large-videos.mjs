import { rm, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const videoDir = resolve('dist/portfolio/videos')

try {
  await stat(videoDir)
  await rm(videoDir, { recursive: true, force: true })
  console.log(`Removed large local video assets from ${videoDir}`)
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error
  }
  console.log('No local video assets found in dist.')
}
