<%= banner %><% functions.forEach(fn => { %>const <%= fn.id %> = <%= fn.code %>;
<% }); %>
fixture<%= feature.options.only === true ? '.only' : '' %> `<%= quote(feature.title) %>`<%= feature.annotations.url
  ? `\n  .page(${JSON.stringify(feature.annotations.url)})` : '' %><%= feature.beforeEach
  ? `\n  .beforeEach(async t => {${feature.beforeEach.map(x => `\n    await ${x};`).join('')}\n  })` : '' %><%= feature.afterEach
  ? `\n  .afterEach(async t => {${feature.afterEach.map(x => `\n    await ${x};`).join('')}\n  })` : '' %>;
<% feature.scenarios.forEach(scenario => { %>
test<%= scenario.annotations.url
  ? `\n  .page(${JSON.stringify(scenario.annotations.url)})` : '' %><%= scenario.before
  ? `\n .before(async t => {${scenario.before.map(x => `\n    await ${x};`).join('')}\n  })` : '' %>
  <%= scenario.options.only === true ? '.only' : '' %>(`<%= quote(scenario.title) %>`, async t => {
  <% (scenario.tests || []).forEach(test => { %>
  await <%= test.step %>(<%= (test.data || []).map(x => JSON.stringify(x)).join(', ') %>)(t);<% }) %>
  })<%= scenario.after ? `\n  .after(async t => {${scenario.after.map(x => `\n    await ${x};`).join('')}\n  })` : '' %>;
<% }); %>
