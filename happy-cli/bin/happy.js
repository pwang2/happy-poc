#!/usr/bin/env node
/* eslint no-console:0 import/no-dynamic-require:0, global-require:0 */
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const execa = require('execa')
const waitOn = require('wait-on')
const program = require('commander')
const checkWorkingDir = require('../helpers/checkWorkingDir.js')

const pkgFile = checkWorkingDir()
const context = path.dirname(pkgFile)

process.env.PLUGIN_CWD = context
process.env.WEBPACK_SERVE_PORT = process.env.WEBPACK_SERVER_PORT || 8888
process.env.XE_PORT = process.env.XE_PORT || 8000

const outputDir = path.join(context, '/dist')
const resolveLocalBin = (exe) =>
  path.resolve(__dirname, `../node_modules/.bin/${exe}`)

const startDevServer = () => {
  const devServerArgs = [path.resolve(__dirname, '../webpack.config.js')]
  execa(resolveLocalBin('webpack-serve'), devServerArgs, { stdio: 'inherit' })
}

const startHapiServer = (env) => {
  const script = path.resolve(__dirname, '../lib/serve.js')
  const watchDir = path.resolve(context, 'src/server')
  const args = ['--watch', watchDir, '--ext', 'html,js,json', script]
  if (env.inspect) {
    args.unshift(`--inspect`)
  }
  return execa(resolveLocalBin('nodemon'), args, { stdio: 'inherit' })
}

program
  .version(require('../package.json').version)
  .description('xe minimal cli')

program
  .command('serve')
  .alias('s')
  .description('serve xe plugin in dev mode')
  .option('-i --inspect', 'start node inspect')
  .action((env) => {
    execa.shellSync(`rm -rf ${outputDir}`)
    startDevServer()
    waitOn({ resources: [outputDir] }, (err) => {
      if (err) throw err
      startHapiServer(env)
    })
  })

program
  .command('build')
  .alias('b')
  .description('build xe plugin')
  .action(() => {
    execa.shellSync(`rm -rf ${outputDir}`)
    require('../lib/build')()
  })

program
  .command('init')
  .description('create an xe plugin')
  .action(() => require('../lib/init'))

program.parse(process.argv)

if (process.argv.length === 2) {
  program.outputHelp()
}
