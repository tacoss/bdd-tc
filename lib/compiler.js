const vm = require('vm');
const fs = require('fs-extra');
const path = require('path');
const Yadda = require('yadda');

const SKIP_PROPS = ['before', 'after', 'tags', 'only', 'skip', 'url', 'path'];

const RE_SPLIT = /[\s;,]/;
const RE_JSON_VALUE = /^(\{.*?\}|\[.*?\]|".*?")$/;
const RE_PARAM_PLACEHOLDER = /\$(\w+)/g;
const RE_DEFAULT_EXPORT = /^([\s\S]*?)\b(export\s+default\s*|module.exports\s*=\s*)([\s\S]*?)$/;

const readFile = file => fs.readFileSync(file).toString();

const renderFor = {
  testcafe: require('./testcafe.js'),
};

function omit(obj, keys) {
  return Object.keys(obj).reduce((prev, cur) => {
    if (!keys.includes(cur)) {
      prev[cur] = obj[cur];
    }

    return prev;
  }, {});
}

function push(to, data) {
  (data || []).forEach(x => {
    if (x.path && !to.includes(x.path)) {
      to.push(x.path);
    }
  });
}

function hasTags(a, b) {
  if (!b.length) {
    return true;
  }

  if (!a) {
    return true;
  }

  for (let i = 0; i < b.length; i += 1) {
    if (a.includes(b[i])) {
      return true;
    }
  }
}

function toArray(value) {
  return (!Array.isArray(value) ? [value] : value);
}

function compileMatcher(label, context) {
  const { matchers } = context;

  return new RegExp(label.replace(RE_PARAM_PLACEHOLDER, ($0, name) => {
    return (matchers && matchers[name]) || '(.+)';
  }), 'i');
}

function compileFeatures(params) {
  const parser = new Yadda.parsers.FeatureParser(params.Language);

  return new Yadda.FeatureFileSearch(params.srcDir).list().map(file => {
    const data = parser.parse(readFile(file));

    data.relative = path.relative(params.srcDir, file.replace('.feature', ''));
    data.filepath = file;

    return data;
  });
}

function compileSteps(params) {
  const sandbox = {};
  const context = {};

  vm.createContext(sandbox);

  const tests = params.stepFiles.reduce((prev, step) => {
    const matches = readFile(step).match(RE_DEFAULT_EXPORT);
    const steps = matches[3];

    vm.runInContext(`steps=${steps}`, sandbox);

    const fixtures = Object.keys(sandbox.steps).map(label => {
      if (typeof sandbox.steps[label] !== 'function') {
        const input = Object.keys(sandbox.steps[label]).reduce((object, cur) => {
          if (typeof sandbox.steps[label][cur] === 'function') {
            object[cur] = step;
          } else {
            object[cur] = sandbox.steps[label][cur];
          }
          return object;
        }, {});

        if (typeof context[label] === 'object' && !Array.isArray(context[label])) {
          context[label] = Object.assign({}, context[label], input);
        } else {
          context[label] = input;
        }
        return;
      }

      if (label === 'url') {
        Object.defineProperty(context, '__URL__', {
          value: step,
        });
        return;
      }

      if (SKIP_PROPS.includes(label)) {
        throw new Error(`Property ${label} should not be a function (${path.relative(process.cwd(), step)})`);
      }

      return {
        build: () => compileMatcher(label, context),
        name: label,
      };
    });

    prev.push({
      filepath: step,
      steps: fixtures.filter(Boolean),
    });

    return prev;
  }, []);

  return [tests, context];
}

function compileMacros(options, annotations) {
  const data = (options.feature || options.scenario).options;
  const input = omit(data, SKIP_PROPS);

  ['before', 'after'].forEach(key => {
    if (data[key]) {
      if (!annotations[key]) {
        throw new Error(`Missing ${key} functions`);
      }

      toArray(data[key]).forEach(fn => {
        if (!annotations[key][fn]) {
          throw new Error(`Unknown method '${fn}', given ${annotations[key][fn]}`);
        }

        if (options.feature) {
          options.feature[`${key}Each`] = options.feature[`${key}Each`] || [];
          options.feature[`${key}Each`].push({ fn, input, path: annotations[key][fn] });
        }

        if (options.scenario) {
          options.scenario[key] = options.scenario[key] || [];
          options.scenario[key].push({ fn, input, path: annotations[key][fn] });
        }
      });
    }
  });
}

function compileData(annotations, defaults) {
  return Object.assign({}, defaults, Object.keys(annotations).reduce((prev, cur) => {
    if (RE_JSON_VALUE.test(annotations[cur])) {
      prev[cur] = JSON.parse(annotations[cur]);
    } else if (RE_SPLIT.test(annotations[cur])) {
      prev[cur] = annotations[cur].split(RE_SPLIT);
    } else {
      prev[cur] = annotations[cur];
    }

    return prev;
  }, {}));
}

function compile(params) {
  params.Language = Yadda.localisation[params.lang] || Yadda.localisation.English;
  params.baseDir = params.baseDir || process.cwd();

  const [stepMatcher, context] = compileSteps(params);

  if (!stepMatcher.length) {
    throw new Error('Missing steps');
  }

  compileFeatures(params).forEach(feature => {
    const steps = [];

    if (feature.annotations.skip === true) {
      return;
    }

    feature.options = compileData(feature.annotations);

    feature.scenarios.forEach(scenario => {
      if (scenario.annotations.skip === true) {
        return;
      }

      scenario.options = compileData(scenario.annotations, omit(feature.options, SKIP_PROPS));

      if (params.useTags && !hasTags(scenario.options.tags, params.useTags)) {
        return;
      }

      scenario.tests = scenario.steps.map(step => {
        for (let i = 0; i < stepMatcher.length; i += 1) {
          const test = stepMatcher[i];

          for (let j = 0; j < test.steps.length; j += 1) {
            const matcher = test.steps[j];
            const values = step.match(matcher.build());

            if (values) {
              if (!steps.includes(test.filepath)) {
                steps.push(test.filepath);
              }

              return {
                data: values.slice(1),
                path: test.filepath,
                step: matcher.name,
              };
            }
          }
        }

        throw new Error(`Unmatched step for: ${step}\n  on ${feature.filepath}`);
      });

      compileMacros({ scenario }, context);
    });

    compileMacros({ feature }, context);

    if (feature.beforeEach) {
      push(steps, feature.beforeEach);
    }

    if (feature.afterEach) {
      push(steps, feature.afterEach);
    }

    feature.scenarios.forEach(scenario => {
      push(steps, scenario.before);
      push(steps, scenario.after);
    });

    const url = context.__URL__;
    const destDir = params.destDir;
    const testFile = path.join(destDir, `${feature.relative}.js`);

    fs.outputFileSync(testFile, renderFor.testcafe({
      destDir, feature, steps, url,
    }));
  });
}

module.exports = compile;
