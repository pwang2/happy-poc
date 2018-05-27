const crypto = require('crypto')

module.exports = {
  getData(userCookie) {
    const shasum = crypto.createHash('sha1')
    shasum.update(userCookie)

    // similate aysnc service call here
    return new Promise((res) => {
      setTimeout(() => {
        const sha = shasum.digest('hex')
        res(sha)
      }, 1000)
    })
  }
}
