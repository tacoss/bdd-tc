const path = require('path');

const PWD = process.cwd();

const RE_SYMBOLS = /[$`]/g;

const CACHED_LOOKUPS = {};

function lookup(list, value) {
  if (typeof CACHED_LOOKUPS[value] === 'undefined') {
    CACHED_LOOKUPS[value] = list.indexOf(value);
  }

  return CACHED_LOOKUPS[value];
}

function relative(file, baseDir) {
  return path.relative(baseDir || PWD, file);
}

function escapeSymbols(value) {
  return value.replace(RE_SYMBOLS, '\\$&');
}

module.exports = ({ destDir, feature, steps }) => `${
  steps.map((file, nth) => `import $step${nth} from '${relative(file, destDir)}';`).join('\n')
}

// ${relative(feature.filepath)}
fixture \`${escapeSymbols(feature.title)}\`${
  feature.options.url ? `\n  .page(${JSON.stringify(feature.options.url)})` : ''
}${
  feature.beforeEach ? `\n  .beforeEach(async t => {
${feature.beforeEach.map(hook => `    await $step${lookup(steps, hook.path)}.before.${hook.fn}(${
    JSON.stringify(hook.input)
  })(t);`).join('\n')}
  })` : ''
}${
  feature.afterEach ? `\n  .afterEach(async t => {
${feature.afterEach.map(hook => `    await $step${lookup(steps, hook.path)}.after.${hook.fn}(${
    JSON.stringify(hook.input)
  })(t);`).join('\n')}
  })` : ''
};

${feature.scenarios.map(scenario => `test${
    scenario.options.url ? `\n  .page(${JSON.stringify(scenario.options.url)})` : ''
  }${
    scenario.before ? `\n  .before(async t => {
${scenario.before.map(hook => `    await $step${lookup(steps, hook.path)}.before.${hook.fn}(${
    JSON.stringify(hook.input)
  })(t);`).join('\n')}
  })` : ''
  }(\`${escapeSymbols(scenario.title)}\`, async t => {
${scenario.tests.map(test => `  await $step${lookup(steps, test.path)}[\`${escapeSymbols(test.step)}\`](${
    test.data.map(value => JSON.stringify(value)).join(', ')
  })(t);`).join('\n')}
})${
  scenario.after ? `\n  .after(async t => {
${scenario.after.map(hook => `    await $step${lookup(steps, hook.path)}.after.${hook.fn}(${
    JSON.stringify(hook.input)
  })(t);`).join('\n')}
  })` : ''
};`).join('\n')}
`;
