/* eslint no-console:0, import/no-dynamic-require:0, global-require:0 */
const webpack = require('webpack')

const outputOpts = { colors: true, modules: false, children: false }
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

module.exports = () => {
  webpack(require('../webpack.config.js'), (err, stats) => {
    if (err) throw err
    console.log(stats.toString(outputOpts))
  })
}
