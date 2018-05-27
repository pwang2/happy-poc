#!/usr/bin/env node
/* eslint no-console:0, import/no-dynamic-require:0, global-require:0 */
const fs = require('fs')
const opn = require('opn')
const glue = require('glue')
const path = require('path')
const handlebars = require('handlebars')
require('handlebars-helpers')(handlebars)

function getConfig(cwd) {
  const configFile = path.resolve(cwd, 'happy.config.js')
  return require(configFile)
}

function getDefaultPrefix(cwd) {
  const { name } = require(path.resolve(cwd, 'package.json'))
  return `/${name.substr(3)}/`
}

function getInjectedConfig(port = 8000, cwd) {
  const plugin = require(cwd)
  const prefix = getDefaultPrefix(cwd)
  const { pluginConfig, registerConfig } = getConfig(cwd)

  const devPluginRegistration = {
    plugin: {
      register: plugin,
      options: { isDev: true, devServePort: 8888, ...pluginConfig }
    },
    // register options like routes prefix, layout, see glue docs
    options: { routes: { prefix }, ...registerConfig }
  }

  const config = {
    manifest: {
      connections: [{ port }],
      registrations: [
        { plugin: { register: 'h2o2' } },
        { plugin: { register: 'vision' } },
        { plugin: { register: 'inert' } },
        { plugin: { register: 'blipp', options: { showAuth: true } } },
        {
          plugin: {
            register: 'hapi-bunyan-logger',
            options: { bunyanStreams: [], opsInterval: 30000 }
          }
        },
        devPluginRegistration
      ]
    },
    options: {}
  }

  return config
}

const { XE_PORT: port, PLUGIN_CWD: cwd } = process.env
const { manifest, options } = getInjectedConfig(port, cwd)

const plugin = require(cwd)
const pluginRegisterConfig = manifest.registrations.slice(-1)[0]
const { prefix } = pluginRegisterConfig.options.routes

glue.compose(manifest, options, (err, server) => {
  const { logger } = server.plugins['hapi-bunyan-logger']

  // last resort of the node process
  // should use process manager/consul to re-spawn dead process
  process.on('unhandledRejection', (unhandledErr) => {
    logger.error({ unhandledErr, unhandled: true })
  })

  process.on('uncaughtException', (unhandledErr) => {
    logger.error({ unhandledErr, unhandled: true })
  })

  server.views({
    engines: { html: handlebars },
    layout: path.resolve(__dirname, '../layout'),
    allowAbsolutePaths: true,
    context: {
      title: prefix.slice(1, -1),
      homeRoute: prefix,
      currentYear: new Date().getFullYear()
    }
  })

  server.start((startErr) => {
    if (startErr) throw startErr
    const url = `http://0.0.0.0:${server.info.port}${prefix}`
    logger.info(`server running under ${url}`)
    opn(url)
  })
})
