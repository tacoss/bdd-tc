<%= banner %><% functions.forEach(fn => { %>async function <%= fn.id %><%= fn.code %>
<% }); %>
fixture<%= feature.options.only === true ? '.only' : '' %> `<%= quote(feature.title) %>`<%= feature.annotations.url
  ? `\n  .page(${JSON.stringify(feature.annotations.url)})` : '' %><%= feature.beforeEach
  ? `\n  .beforeEach(${feature.beforeEach})` : '' %><%= feature.afterEach
  ? `\n  .afterEach(${feature.afterEach})` : '' %>;
<% feature.scenarios.forEach(scenario => { %>
test<%= scenario.annotations.url
  ? `\n  .page(${JSON.stringify(scenario.annotations.url)})` : '' %><%= scenario.before
  ? `\n .before(${scenario.before})` : '' %>
  <%= scenario.options.only === true ? '.only' : '' %>(`<%= quote(scenario.title) %>`, async t => {
  <% (scenario.tests || []).forEach(test => { %>
  await <%= test.step %>.call(t, <%= (test.data || []).map(x => JSON.stringify(x)).join(', ') %>);<% }) %>
  })<%= scenario.after ? `\n  .after(${scenario.after})` : '' %>;
<% }); %>
