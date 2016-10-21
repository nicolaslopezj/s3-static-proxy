import express from 'express'
import s3Proxy from './lib/s3'
import prerender from 'prerender-node'

const app = express()
const port = process.env.PORT || 3200

if (process.env.PRERENDER_TOKEN) {
  console.log('Using prerender')
  app.use(prerender.set('prerenderToken', process.env.PRERENDER_TOKEN))
}

console.log(`Using bucket: ${process.env.BUCKET}`)
app.get('/*', s3Proxy({
  bucket: process.env.BUCKET,
  // prefix: 'optional_s3_path_prefix',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  overrideCacheControl: 'max-age=1'
}))

app.listen(port, function () {
  console.log('Proxy listening at port ' + port)
})
