### TL; DR:

A plugin is npm installable and congurable in app bootstrap phase.

A plugin provides isolation about business logic and expose routes to embodyment business feature.

A plugin should be able to be developed without the presence of the App shell. (I create a tiny xe-cli for this)

A plugin will use vue component to render all reusable presentational component and user interactable component(like table). This provides better testability, api, isolation than handlebar partials

A global content empty layout file will be created in app layer to implement application level concern injection like(google analytics, walkme, etc.). In contrast,

A plugin is not responsible for any application level concern (see Assumptions #1)

At the best, a plugin should expose api to config/decorate an existing route with application level concerns like auth/cache/scope in app configuration. This is limited by the hapi plugin structure, but it is feasible if we want to define our one plugin signature and an adapt layer for glue to consume.

Before the remedy is planned, when developing a plugin with application level concerns, A customized app wrapper with the auth/cache definition need be created and passed to `xe server` as argument. (see Assumptions #4)

A plugin will follow very simple conventions to create views/pages, xhr endpoint. This is coordinated by a shared plugin-base package.

A page plugin is not supposed to be too drastically change the server object besides its exposure. If needed or the change is global, we shall create global plugin instead.

### API to utilize for plugin creation

View engine configuration could be re-configured in plugin(NOT partials) see: [https://github.com/hapijs/vision/blob/v4.1.1/API.md](https://github.com/hapijs/vision/blob/v4.1.1/API.md)

Plugin could inherits the server/app level data via server.app API. see [https://hapijs.com/api/16.6.3#serverapp](https://hapijs.com/api/16.6.3#serverapp)

Plugin could isolate the context within itself via server.bind API. see [https://hapijs.com/api/16.6.3#serverbindcontext](https://hapijs.com/api/16.6.3#serverbindcontext)

Plugin state/method query is possible via server.plugins[plugin-name][{exposure}]. See [https://hapijs.com/api/16.6.3#serverexposeobj](https://hapijs.com/api/16.6.3#serverexposeobj) (NOT SUGGEST TO USE)

Assumptions:

1.  App platform implementation contains a sets of application specific concerns with minimal declaration about how page plugins should behave. Following concerns should be fall in app platform side:

    1.  Auth

    2.  Plugin configuration

    3.  Client tags management (If we put the shared layout in app)

    4.  Zero downtime reload (TBD: Need a schedule/watcher then listen all connections is processed to restart.)

    5.  Logging

    6.  APM

2.  Plugin is used for isolation of business logic/user workflow. Each plugin is self-contained in a node package with hapijs plugin API exposed `(server, options, next)=>{/*implementation*/}`

3.  Plugin enables turn on/off , configured a plugin’s behavior before the app start. In the long term, plugin configuration should be scalable and could be live reload via a manager interface without application hard restart.

4.  Plugin is built upon a shared base layer. The base layer is featured to provide utility as below:

    7.  Shared methods(TBD, patching server object seems abused).

    8.  Cache policy (by default, cache is configured when server is started)

    9.  Scope definition (TBD, this requires modify the base layer when a new scope is added) The app maintain the scope contract with base layer only.

    10. Features above might or might not reusable app by app. To make most sense, the base layer would stay out of the app side and present as a module standalone instead of monkey patching to hapi server object.

### Define the plugin pattern:

1.  Use Vue component instead of partials. This enables partials sharing across plugins. No need to defined in the engine/app level.

2.  Use Vue component for reusable block/logic isolation, interaction. Initialization of vue component could be inject via handlebar. <vue-component init-state="{{JSONstringify rawState}}” ></vue-component>

3.  Use layout file for server configuration only(GA, Walkme, Header Meta Management). When layout comes from APP level, the app context(to be created from app configuration) is used to render layout template.

4.  Use plugin view file and reply.view interface for pagescope specific control.

5.  Use `server.bind` to restrict the access to plugin scope.
