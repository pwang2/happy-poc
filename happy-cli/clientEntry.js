const Vue = require('vue').default

const requireAll = (ctx, fn) =>
  ctx
    .keys()
    .map(ctx)
    .map((m) => fn(m.default))

// register all vue components under components folder
const context = require.context('@client/components', true, /\.vue$/)
requireAll(context, (component) => Vue.component(component.name, component))

const vueConfig = { delimiters: ['{(', ')}'], el: '#app' }

// register vue store if store/index.js is found
const storeCtx = require.context('@client', true, /store\/index\.js/)
const [key] = storeCtx.keys()
if (key !== undefined) {
  vueConfig.store = storeCtx(key).default
}

// eslint-disable-next-line
window.__APP__ = new Vue(vueConfig)
