## Introduction

A minimal hapi plugin build system to make hapi plugin with static result to be easy composable via `glue`

### Goal

* Plugin should be installable and configurable
* Simple convention to follow and hide details like bundling and registration. Developers should only do
  valuable coding instead of wasting time on work like fixing webpack config, etc.
* Minimal development and integration interface.
* Make error fail loudly and trackable
* Developer Experience
### Build
```
# prepare dev
(cd hapi-bunyan-logger && npm link)
(cd happy-plugin-base && npm link)
(cd happy-cli && npm link hapi-bunyan-logger && npm link)
(cd hp-demo && npm link happy-plugin-base && npm install)
```

### Repos

| repo                | description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `hapi-buyan-logger` | hapi plugin to intercept hapi server.log interface and output as bunyan format |
| `happy-plugin-base`    | mix wrap use code structure convention to create installable hapi page pugin   |
| `happy-cli`            | a bare minimal cli tool to build/server xep plugin in development              |

### Plugin folder structure

```
src
├── plugin.js        | hapi plugin registration entry.  extension method is optional
├── client
│   ├── components   | vue components to be registered as global custom element to be used in handler bar template
│   └── store        | vue store to encapsule component data interaction. it also makes the unit test way simple
└── server
    ├── controllers  | framework free controller
    ├── routes       | hapi router object
    └── views        | handler page template.
```

### Q&A

* what happens when i run `happy serve`?

  > happy cli will read client folder content and use webpack to bundle the resource and bundle it for
  > plugin use(served with webpack-serve in development via h2o2, served with inert in production)
  > after that, a hapi server will be started vith some default plugins enabled. see [server.js]

* what if my vue component or handlebar template requires other assets like images?

  > Just create an asset folder and make your src attribute point to the relative path resolved from current file
  > for asset used in vue component, webpack will use the loader config to extract the resource to dist folder.
  > for asset used in handlerbar template, webpack will also process the template file and extract the
  > resource to URI path which could be resolved by browser correctly
  > see [webpack.config.js]

* why framework free controllers instead of hapi handler?

  > hapi handler has hard dependency to hapi request and reply interface, this will result a lot of work
  > when we upgrade to hapi v17 or other server framework

* what would be the workflow look like from the plugin development to integration with hapi server
  webapp?

  > 1.  use `happy init` to create a new plugin
  > 2.  use `happy server` command to watch and serve all resource in develpment. TODO: test should be
  >     created for both client and server
  > 3.  use `happy build` (default to production mode) to build the assets and file to dist folder
  > 4.  based on your git workflow, use ci to run happy build and npm version {type} then npm publish to
  >     make it avaliabel to artifactor
  > 5.  in hapi server webapp repo, use npm install to install plugin published in #4 from
  >     artifactory. create a [plugin-name].config.js to instruct how the plugin should be
  >     registerd(via registed config) and what the options the plugin should be instantiate with.

* but there would always be case conventions can not handler?
  > welcome to the norm of development. In such case, first validate the requirement generality then
  > extend it with happy-cli. since the development interface and integration interface is bare minimal,
  > it should not heart-breaking thing to add/make change.

* what to expect?
> * common pattern could be extracted to `happy-plugin-base` to reduce code
> * add joi validation for all plugins
> * better client caching, currently static assets are scoped under each plugin.  since the statis
>    assets are already hash named, we could use npm post install to install all static assets to
>    `node_modues/.happy-static-asset/` folder and serve as /dist root route.
> * debuggablility
