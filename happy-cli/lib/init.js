/* eslint no-shadow:0, no-console:0 */
const path = require('path')
const async = require('async')
const inquirer = require('inquirer')
const Metalsmith = require('metalsmith')
const { handlebars } = require('consolidate')

function ask(files, metalsmith, done) {
  const prompts = [
    {
      type: 'input',
      name: 'name',
      message: 'input plugin package name ',
      default: path.basename(process.cwd()),
      validate: (input) =>
        /hp-.*/.test(input) || 'plugin should be named with prefix xep-'
    },
    {
      type: 'input',
      name: 'description',
      message: 'input plugin package description',
      default: 'happy plugin to work in hapi runtime'
    }
  ]
  const metadata = metalsmith.metadata()

  const run = (promptObject, done) => {
    inquirer
      .prompt(promptObject)
      .then((answers) => {
        metadata[promptObject.name] = answers[promptObject.name]
      })
      .then(() => done())
  }

  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'createHere',
        message: 'About to create files to current directory, continue?',
        default: false
      }
    ])
    .then((answers) => {
      if (!answers.createHere) {
        // eslint-disable-next-line
        console.log('Abort!')
        process.exit(1)
      }
    })
    .then(() => {
      async.eachSeries(prompts, run, done)
    })
}

function template(files, metalsmith, done) {
  const keys = Object.keys(files)
  const metadata = metalsmith.metadata()
  metadata.unprefixedName = metadata.name.substr(3)

  function run(file, done) {
    const str = files[file].contents.toString()

    handlebars.render(str, metadata, (err, res) => {
      if (err) {
        console.log(file)
        done(err)
      } else {
        // eslint-disable-next-line
        files[file].contents = new Buffer(res)
        done()
      }
    })
  }
  async.each(keys, run, done)
}

/**
 * certain dot files are ignored by default by npmrc,
 * which cause trouble when init from template
 */
function renameDotfile(files, metalsmith, done) {
  Object.keys(files)
    .filter((filename) => path.basename(filename).startsWith('_'))
    .forEach((filename) => {
      // eslint-disable-next-line
      files[`.${filename.substr(1)}`]= files[filename]
      // eslint-disable-next-line
      delete files[filename]
    })
  done()
}

Metalsmith(process.cwd())
  .destination('.')
  .source(path.resolve(__dirname, '../templates'))
  .ignore('.DS_Store')
  .use(renameDotfile)
  .use(ask)
  .use(template)
  .build((err) => {
    if (err) throw err

    console.log('\nstart you project with\n')
    console.log('    npm install')
    console.log('    happy serve')
    console.log()
  })
