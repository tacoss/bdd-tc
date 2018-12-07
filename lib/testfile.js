<%= banner %>fixture `<%= quote(feature.title) %>`<%= feature.annotations.url ? `\n  .page(${JSON.stringify(feature.annotations.url)})` : '' %>;
<% steps.forEach((step, key) => { %>
async function <%= step.id %><%= step.code %><% }); %>
<% feature.scenarios.forEach(scenario => { %>
test<%= scenario.annotations.url ? `\n  .page(${JSON.stringify(scenario.annotations.url)})` : '' %>
  (`<%= quote(scenario.title) %>`, async t => {
  <% scenario.steps.forEach(test => { %>
  await <%= test.step %>.call(t, <%= test.data.map(x => JSON.stringify(x)).join(', ') %>);<% }) %>
  });
<% }); %>
