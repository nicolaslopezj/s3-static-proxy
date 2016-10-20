import express from 'express'
import s3Proxy from './lib/s3'

const app = express()
const port = process.env.PORT || 3200

app.get('/*', s3Proxy({
  bucket: process.env.BUCKET,
  // prefix: 'optional_s3_path_prefix',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  overrideCacheControl: 'max-age=100000'
}))

app.listen(port, function () {
  console.log('Proxy listening at port ' + port)
})
