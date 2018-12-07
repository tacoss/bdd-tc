const vm = require('vm');
const fs = require('fs-extra');
const path = require('path');
const Yadda = require('yadda');
const _template = require('lodash.template');

const TPL_TESTFILE = fs.readFileSync(`${__dirname}/testfile.js`).toString();

const RE_THIS_VARIABLE = /\bthis\b/;
const RE_PARAM_PLACEHOLDER = /\$(\w+)/g;
const RE_DEFAULT_EXPORT = /^([\s\S]*?)\b(export\s+default\s*|module.exports\s*=\s*)([\s\S]*?)$/;

const readFile = file => fs.readFileSync(file).toString();
const renderFile = _template(TPL_TESTFILE);

function compileMatcher(label, context) {
  const { matchers } = context;

  return new RegExp(label.replace(RE_PARAM_PLACEHOLDER, ($0, name) => {
    return (matchers && matchers[name]) || '(.+)';
  }), 'i');
}

function compileFeatures(params) {
  const parser = new Yadda.parsers.FeatureParser(params.Language);
  const featuresDir = path.join(params.srcDir, 'features');

  return new Yadda.FeatureFileSearch(featuresDir).list().map(file => {
    const data = parser.parse(readFile(file));

    data.relative = path.relative(featuresDir, file.replace('.feature', ''));
    data.filepath = file;

    return data;
  });
}

function compileSteps(params) {
  return params.stepFiles.reduce((prev, step) => {
    const matches = readFile(step).match(RE_DEFAULT_EXPORT);
    const prelude = matches[1];
    const steps = matches[3];

    const sandbox = {};
    const context = {};

    vm.createContext(sandbox);
    vm.runInContext(`steps=${steps}`, sandbox);

    const fixtures = Object.keys(sandbox.steps).map(label => {
      if (typeof sandbox.steps[label] !== 'function') {
        context[label] = sandbox.steps[label];
        return;
      }

      let code = sandbox.steps[label].toString()
        .replace(label, '')
        .replace(/^['"]{2}/, '')
        .trim();

      code = code.replace(RE_THIS_VARIABLE, 'await this');

      return {
        id: label.replace(/\W+/g, '_'),
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
}

function compile(params) {
  params.Language = Yadda.localisation[params.lang] || Yadda.localisation.English;
  params.baseDir = params.baseDir || process.cwd();

  const stepMatcher = compileSteps(params);

  compileFeatures(params).forEach(feature => {
    const usedSteps = [];
    const prelude = [];
    const steps = [];

    feature.scenarios.forEach(scenario => {
      scenario.steps = scenario.steps.map(step => {
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

        throw new Error(`Unmatched step for: ${step}\n  ${feature.filepath}`);
      });
    });

    const testFile = path.join(params.destDir, `cases/${feature.relative}.js`);

    fs.outputFileSync(testFile, renderFile({
      banner: prelude.join(''),
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
