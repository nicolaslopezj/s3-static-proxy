var AWS = require('aws-sdk')
import pick from 'lodash.pick'
import trim from 'lodash.trim'
import reject from 'lodash.reject'
import assign from 'lodash.assign'
import awsConfig from 'aws-config'
import urljoin from 'url-join'
import mime from 'mime'
import base64 from 'base64-stream'
import replaceStream from 'replacestream'

const debug = function (...args) {
  console.log(...args)
}

require('simple-errors')

// HTTP headers from the AWS request to forward along
var awsForwardHeaders = ['content-type', 'last-modified', 'etag', 'cache-control']

module.exports = function (options) {
  var s3 = new AWS.S3(assign(awsConfig(options),
    pick(options, 'endpoint', 's3ForcePathStyle')))

  function getObject (req, res, next) {
    // This will get everything in the path following the mountpath
    var s3Key = 'index.html'

    // Chop off the querystring, it causes problems with SDK.
    var queryIndex = s3Key.indexOf('?')
    if (queryIndex !== -1) {
      s3Key = s3Key.substr(0, queryIndex)
    }

    // Strip out any path segments that start with a double dash '--'. This is just used
    // to force a cache invalidation.
    s3Key = reject(s3Key.split('/'), function (segment) {
      return segment.slice(0, 2) === '--'
    }).join('/')

    var s3Params = {
      Bucket: options.bucket,
      Key: options.prefix ? urljoin(options.prefix, s3Key) : s3Key
    }

    debug('get s3 object with key %s', s3Params.Key)

    var base64Encode = req.acceptsEncodings(['base64']) === 'base64'

    // The IfNoneMatch in S3 won't match if client is requesting base64 encoded response.
    if (req.headers['if-none-match'] && !base64Encode) {
      s3Params.IfNoneMatch = req.headers['if-none-match']
    }

    debug('read s3 object', s3Params.Key)
    var s3Request = s3.getObject(s3Params)

    // Write a custom http header with the path to the S3 object being proxied
    var headerPrefix = req.app.settings.customHttpHeaderPrefix || 'x-4front-'
    res.setHeader(headerPrefix + 's3-proxy-key', s3Params.Key)

    s3Request.on('httpHeaders', function (statusCode, s3Headers) {
      debug('received httpHeaders')

      // Get the contentType from the headers
      awsForwardHeaders.forEach(function (header) {
        var headerValue = s3Headers[header]

        if (header === 'content-type') {
          if (headerValue === 'application/octet-stream') {
            // If the content-type from S3 is the default "application/octet-stream",
            // try and get a more accurate type based on the extension.
            headerValue = mime.lookup(req.path)
          }
        } else if (header === 'cache-control') {
          if (options.overrideCacheControl) {
            debug('override cache-control to', options.overrideCacheControl)
            headerValue = options.overrideCacheControl
          } else if (!headerValue && options.defaultCacheControl) {
            debug('default cache-control to', options.defaultCacheControl)
            headerValue = options.defaultCacheControl
          }
        } else if (header === 'etag' && base64Encode) {
          headerValue = '"' + trim(headerValue, '"') + '_base64' + '"'
        } else if (header === 'content-length' && base64Encode) {
          // Clear out the content-length if we are going to base64 encode the response
          headerValue = null
        }

        if (headerValue) {
          debug('set header %s=%s', header, headerValue)
          res.set(header, headerValue)
        }
      })
    })

    debug('read stream %s', s3Params.Key)

    var readStream = s3Request.createReadStream()
      .on('error', function (err) {
        debug('readStream error')
        // If the code is PreconditionFailed and we passed an IfNoneMatch param
        // the object has not changed, so just return a 304 Not Modified response.
        if (err.code === 'NotModified' ||
          (err.code === 'PreconditionFailed' && s3Params.IfNoneMatch)) {
          return res.status(304).end()
        }
        if (err.code === 'NoSuchKey') {
          return next(Error.http(404, 'Missing S3 key', {code: 'missingS3Key', key: s3Params.key}))
        }
        return next(err)
      })

    if (base64Encode) {
      debug('base64 encode response')
      res.setHeader('Content-Encoding', 'base64')
      readStream = readStream.pipe(base64.encode())
    }

    // https://s3.amazonaws.com/events-beta/index.html

    readStream
    .pipe(replaceStream(/="\//g, function () {
      return '="https://s3.amazonaws.com/events-beta/'
    }))
    .pipe(res)
  }

  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    getObject(req, res, next)
  }
}
