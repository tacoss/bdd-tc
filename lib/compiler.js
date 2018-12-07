const vm = require('vm');
const fs = require('fs-extra');
const path = require('path');
const Yadda = require('yadda');
const rimraf = require('rimraf');
const _template = require('lodash.template');

const TPL_TESTFILE = fs.readFileSync(`${__dirname}/testfile.js`).toString();

const RE_SPLIT = /[\s;,]/;
const RE_OBJECT = /^(\{.*?\}|\[.*?\])$/;
const RE_SYMBOLS = /[$`]/g;
const RE_NOT_WORDS = /\W+/g;
const RE_LEAD_QUOTES = /^['"]{2}/;
const RE_THIS_VARIABLE = /\bthis\b/;
const RE_PARAM_PLACEHOLDER = /\$(\w+)/g;
const RE_DEFAULT_EXPORT = /^([\s\S]*?)\b(export\s+default\s*|module.exports\s*=\s*)([\s\S]*?)$/;

const readFile = file => fs.readFileSync(file).toString();
const renderFile = _template(TPL_TESTFILE);

function push(to, data) {
  if (!to.includes(data)) {
    to.push(data);
  }
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

function snakeCase(label) {
  return label.replace(RE_NOT_WORDS, ' ').trim().split(' ').join('_');
}

function escapeSymbols(value) {
  return value.replace(RE_SYMBOLS, '\\$&');
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
    const prelude = matches[1];
    const steps = matches[3];

    vm.runInContext(`steps=${steps}`, sandbox);

    const fixtures = Object.keys(sandbox.steps).map(label => {
      if (typeof sandbox.steps[label] !== 'function') {
        context[label] = sandbox.steps[label];
        context[label].prelude = prelude;
        return;
      }

      let code = sandbox.steps[label].toString()
        .replace(label, '')
        .replace(RE_LEAD_QUOTES, '')
        .trim();

      code = code.replace(RE_THIS_VARIABLE, 'await this');

      return {
        id: snakeCase(label),
        get: () => compileMatcher(label, context),
        code,
      };
    });

    prev.push({
      filepath: step,
      content: prelude,
      steps: fixtures.filter(Boolean),
    });

    return prev;
  }, []);

  return [tests, context];
}

function compileMacros(target, options, annotations) {
  const data = (options.feature || options.scenario).options;

  if (data.before) {
    if (typeof annotations.before[data.before] !== 'function') {
      throw new Error(`Invalid method '${data.before}', given ${annotations.before[data.before]}`);
    }

    let code = `(async function ${annotations.before[data.before].toString()}).call(t, ${JSON.stringify(data)})`;

    code = code.replace(RE_THIS_VARIABLE, 'await this');

    push(target, annotations.before.prelude);

    if (options.feature) {
      options.feature.beforeEach = code;
    }

    if (options.scenario) {
      options.scenario.before = code;
    }
  }
}

function compileData(annotations) {
  return Object.keys(annotations).reduce((prev, cur) => {
    if (RE_OBJECT.test(annotations[cur])) {
      prev[cur] = JSON.parse(annotations[cur]);
    } else if (RE_SPLIT.test(annotations[cur])) {
      prev[cur] = annotations[cur].split(RE_SPLIT);
    } else {
      prev[cur] = annotations[cur];
    }

    return prev;
  }, {});
}

function compile(params) {
  params.Language = Yadda.localisation[params.lang] || Yadda.localisation.English;
  params.baseDir = params.baseDir || process.cwd();

  const casesDir = path.join(params.destDir, 'cases');
  const [stepMatcher, context] = compileSteps(params);

  if (!stepMatcher.length) {
    throw new Error('Missing steps');
  }

  if (fs.existsSync(casesDir)) {
    rimraf.sync(casesDir);
  }

  compileFeatures(params).forEach(feature => {
    const usedSteps = [];
    const prelude = [];
    const steps = [];

    if (feature.annotations.skip === true) {
      return;
    }

    feature.options = compileData(feature.annotations);

    feature.scenarios.forEach(scenario => {
      if (scenario.annotations.skip === true) {
        return;
      }

      scenario.options = compileData(scenario.annotations);

      if (!hasTags(scenario.options.tags, params.useTags)) {
        return;
      }

      scenario.tests = scenario.steps.map(step => {
        for (let i = 0; i < stepMatcher.length; i += 1) {
          const test = stepMatcher[i];

          for (let j = 0; j < test.steps.length; j += 1) {
            const matcher = test.steps[j];
            const values = step.match(matcher.get());

            if (values) {
              if (!usedSteps.includes(test.filepath)) {
                usedSteps.push(test.filepath);
                prelude.push(test.content);
              }

              if (!steps.includes(matcher)) {
                steps.push(matcher);
              }

              return {
                data: values.slice(1),
                step: matcher.id,
                name: step,
              };
            }
          }
        }

        throw new Error(`Unmatched step for: ${step}\n  on ${feature.filepath}`);
      });

      compileMacros(prelude, { scenario }, context);
    });

    compileMacros(prelude, { feature }, context);

    const testFile = path.join(casesDir, `${feature.relative}.js`);

    fs.outputFileSync(testFile, renderFile({
      banner: prelude.join(''),
      quote: escapeSymbols,
      feature,
      steps,
    }));
  });

  if (params.copyFrom) {
    params.copyFrom.forEach(src => {
      fs.copySync(src, path.join(params.destDir, path.basename(src)));
    });
  }
}

module.exports = compile;
