<%= banner %>fixture(<%= JSON.stringify(feature.title) %>)<%= feature.annotations.url ? `\n  .page(${JSON.stringify(feature.annotations.url)})` : '' %>;
<% feature.scenarios.forEach(scenario => { %>
test<%= scenario.annotations.url ? `\n  .page(${JSON.stringify(scenario.annotations.url)})` : '' %>
  (<%= JSON.stringify(scenario.title) %>, async t => {
  <% scenario.steps.forEach(step => { %>
  await (async /**! <%= step.name %> */ step<%= step.code %>)(<%= JSON.stringify(step.data) %>);
  <% }) %>
  });
<% }); %>
