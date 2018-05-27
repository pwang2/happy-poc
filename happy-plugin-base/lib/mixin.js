const path = require('path')
const glob = require('glob')
const Boom = require('boom')
const uuid = require('uuid/v1')

const resolve = (file, base = __dirname) => path.resolve(base, file)
const isFunc = (v) => typeof v === 'function'

/**
 * A mixin wrap to simplify  the creation of page plugin
 * which wraps the static server, route inject underneath
 * plugin creator only needs to put route in routes folder to make it avaiable to the app
 *
 * @param {basedir: directory to resolve the plugin
 * @param dependencies: plugin dependdency to instruct hapi server}
 * @param extension: any non route extension method
 * @returns {undefined}
 */
function mixin({ basedir, dependencies = [] }, extension) {
  const pkg = require(`${basedir}/package.json`) // eslint-disable-line

  /**
   * A convenient handler to help us write simple route, you could always use (request, reply)  interface if you prefer
   *
   * @param route        {object}               routes to receive the handler
   * @param {1}.template {string}               template name used to render a view, this could happen in GET or NON GET request
   * @param {1}.redirect {string|function}      used to redirect to other uri, this could happen in GET or NON GET request
   * @param {1}.context  {string|function}      object literal or function take request as argument to return the context
   * @returns {undefined}
   */
  function xepViewHandler(route, { template, redirect, context }) {
    return async function replyFn(request, reply) {
      const { method } = request
      const returnJson = request.params.format === 'json'

      if (redirect) {
        const target = isFunc(redirect) ? redirect(request) : redirect
        return reply.redirect(target)
      }

      // eslint-disable-next-line no-shadow
      const { options, basedir } = this
      try {
        const ctx = isFunc(context)
          ? await context(request, options)
          : context || {}
        if (method === 'get' && (returnJson || !template)) {
          return reply(ctx)
        }
        const fullTemplatePath = resolve(
          `dist/src/server/views/${template}.html`,
          basedir
        )
        return reply.view(fullTemplatePath, ctx)
      } catch (err) {
        const id = uuid()
        request.server.log(['error', id], err)
        const boomEntity = Boom.boomify(err)
        boomEntity.output.payload.dragonHere = `report incident with id: ${id}`
        return reply(boomEntity)
      }
    }
  }

  function register(server, options, next) {
    const { isDev, devServePort } = options

    server.route({
      method: 'GET',
      path: 'dist/{param*}',
      config: { description: 'static resource' },
      handler: isDev
        ? { proxy: { uri: `http://0.0.0.0:${devServePort}/dist/{param}` } }
        : { directory: { path: resolve('dist', basedir) } }
    })

    // this makes plugin options avaliable for handler interface
    // we could use this.options in handler to access the plugin config
    // since handler are only allowed to register once, use bind to scope basedir per plugin
    // NOTE: handler SHOULD NOT be arrow function
    server.bind({ options, basedir })

    // register custom xepViewhandler to simply the view render only ONCE
    // eslint-disable-next-line
    if (!server._parent._handlers.xepView) {
      server.handler('xepView', xepViewHandler)
    }

    // regsiter all routes defined in routes folder
    glob.sync(resolve('src/server/routes/*.js', basedir)).forEach((file) => {
      const loaded = require(file) // eslint-disable-line
      const handlers = Array.isArray(loaded) ? loaded : [loaded]

      // eslint-disable-next-line
      handlers.forEach(({ path, method = 'GET', handler, ...rest }) => {
        server.route({ method, path, handler, ...rest })
      })
    })

    server.log('info', `page plugin [${pkg.name}] ready`)

    let nextCalled = false
    if (typeof extension === 'function') {
      extension(server, options, () => {
        next()
        nextCalled = true
      })
    } else {
      throw new Error('mixin takes an extension method as first argument')
    }

    // remedy in case next is not called in plugin.js which cause server hangup
    if (!nextCalled) {
      next()
    }
  }

  const { name, version } = pkg

  register.attributes = {
    name,
    version,
    dependencies: ['inert', ...dependencies]
  }

  return register
}

module.exports = mixin
