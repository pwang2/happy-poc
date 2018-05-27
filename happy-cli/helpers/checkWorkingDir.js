/* eslint no-console:0, import/no-dynamic-require:0, global-require:0 */
const pkgUp = require('pkg-up')

module.exports = () => {
  if (process.argv[2] === 'init') return ''

  // if the cli run with only flag/named arguments like `xe -V`
  if (process.argv.filter((v) => !v.startsWith('-')).length === 2) return ''

  // if help flag is presenting
  if (process.argv.some((v) => v === '-h' || v === '--help')) return ''

  const pkgFile = pkgUp.sync(process.cwd())
  if (!pkgFile) {
    console.error('no valid package.json could be found')
    process.exit(1)
  }

  const { name } = require(pkgFile)

  if (!/hp-.*/.test(name)) {
    console.error('happy cli need to run from happy  plugin project')
    process.exit(1)
  }
  return pkgFile
}
