<%= banner %>fixture(<%= JSON.stringify(feature.title) %>)<%= feature.annotations.url ? `\n  .page(${JSON.stringify(feature.annotations.url)})` : '' %>;
<% steps.forEach((step, key) => { %>
async function <%= step.id %><%= step.code %><% }); %>
<% feature.scenarios.forEach(scenario => { %>
test<%= scenario.annotations.url ? `\n  .page(${JSON.stringify(scenario.annotations.url)})` : '' %>
  (<%= JSON.stringify(scenario.title) %>, async t => {
  <% scenario.steps.forEach(test => { %>
  await <%= test.step %>.call(t, <%= test.data.map(x => JSON.stringify(x)).join(', ') %>);<% }) %>
  });
<% }); %>
