const Oppsy = require('oppsy')
const bunyan = require('bunyan')
const BunyanPrettystream = require('bunyan-prettystream')

const { levelFromName } = bunyan
const { name, version } = require('./package.json')

const levelSortedHighToLow = Object.entries(levelFromName)
  .sort((a, b) => b[1] - a[1])
  .map((d) => d[0])

function flattenOpsData(obj, preKey = '', result = {}) {
  Object.entries(obj).forEach(([key, value]) => {
    const isComplexValue =
      typeof value === 'object' && Array.isArray(value) === false
    const flatedValues = isComplexValue
      ? flattenOpsData(value, key, result)
      : { [preKey ? `${preKey}.${key}` : key]: value.toString() }
    Object.assign(result, flatedValues)
  })
  return result
}

function createLogger(options) {
  const streamConfigs = options.bunyanStreams || []
  const unifiedLogStream = new BunyanPrettystream()
  unifiedLogStream.pipe(process.stdout)
  const config = {
    name: 'app',
    streams: [{ level: 'trace', stream: unifiedLogStream }, ...streamConfigs],
    serializers: bunyan.stdSerializers
  }
  return bunyan.createLogger(config)
}

function register(server, options, next) {
  const logger = createLogger(options)

  server.expose('logger', logger)

  server.decorate('request', 'getLogger', () => logger)

  // handle ops events from oppsy
  server.on('start', () => {
    const oppsy = new Oppsy(server)
    oppsy.start(options.opsInterval || 15000)
    oppsy.on('ops', (data) => {
      const flatedOpsData = flattenOpsData(data)
      logger.info({ ops: true, ping: true, ...flatedOpsData }, '💗 ')
    })
  })

  server.on('stop', () => {
    logger.info('Server stopped')
  })

  // intercept built-in log method
  server.on('log', (event, tags) => {
    let level = 'info'
    for (let i = 0; i < levelSortedHighToLow.length; i += 1) {
      const l = levelSortedHighToLow[i]
      // log at highest level
      if (tags[l]) {
        level = l
        break
      }
    }

    // see https://hapijs.com/api#-log-event
    // error and data will not appear together
    const msg = event.error || event.data

    if (msg instanceof Error) {
      logger[level]({ err: msg, ...tags }) // when log error, error comes first
    } else {
      logger[level](tags, msg)
    }
  })

  server.on({ name: 'request', channels: ['error'] }, (request, event) => {
    logger.error(event.error, `Request ${event.request} failed`)
  })

  server.on('response', (request) => {
    const { method, path, payload, raw } = request
    const { statusCode } = raw.res
    const responseTime = request.info.responded - request.info.received

    logger.info(
      { response: true, healthy: /[23]0\d/.test(statusCode) },
      method,
      path,
      payload,
      statusCode,
      `${responseTime}ms`
    )
  })
  next()
}

register.attributes = { name, version }

module.exports = register
