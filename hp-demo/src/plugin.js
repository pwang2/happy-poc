const path = require('path')
const { mixin } = require('happy-plugin-base')

// basedir is requried to resolve client view template path
// dependencies is to decleare plugin load dependency
const config = { basedir: path.resolve(__dirname, '..'), dependencies: [] }

// plugin body besides routes put here if any
const extensions = (server, options, next) => {
  next()
}

module.exports = mixin(config, extensions)
