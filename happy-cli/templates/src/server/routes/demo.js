const demoController = require('../controllers/demoController.js')

// all route object should rely on controller instead of handler to process
// this decouples the dependency of hapi request and reply interface for future migration
module.exports = [
  {
    path: '/',
    method: 'GET',
    handler: {
      xepView: {
        template: 'index',
        async context(request) {
          const { cookie = "in case you don't have a cookie" } = request.headers
          return {
            hash: await demoController.getData(cookie),
            hapiVersion: 'v16.6.3'
          }
        }
      }
    }
  }
]
