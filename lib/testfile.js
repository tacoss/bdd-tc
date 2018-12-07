<%= banner %>fixture<%= feature.options.only === true ? '.only' : '' %> `<%= quote(feature.title) %>`<%= feature.annotations.url
  ? `\n  .page(${JSON.stringify(feature.annotations.url)})` : '' %><%= feature.beforeEach
  ? `\n .beforeEach(async t => ${feature.beforeEach})` : '' %>;
<% steps.forEach((step, key) => { %>
async function <%= step.id %><%= step.code %><% }); %>
<% feature.scenarios.forEach(scenario => { %>
test<%= scenario.annotations.url
  ? `\n  .page(${JSON.stringify(scenario.annotations.url)})` : '' %><%= scenario.before
  ? `\n .before(async t => ${scenario.before})` : '' %>
  <%= scenario.options.only === true ? '.only' : '' %>(`<%= quote(scenario.title) %>`, async t => {
  <% (scenario.tests || []).forEach(test => { %>
  await <%= test.step %>.call(t, <%= (test.data || []).map(x => JSON.stringify(x)).join(', ') %>);<% }) %>
  });
<% }); %>
