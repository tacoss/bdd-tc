const vm = require('vm');
const fs = require('fs-extra');
const path = require('path');
const Yadda = require('yadda');
const _template = require('lodash.template');

const TPL_TESTFILE = fs.readFileSync(`${__dirname}/testfile.js`).toString();

const RE_PARAM_PLACEHOLDER = /\$(\w+)/g;
const RE_AWAIT_COMMENT = /\bawait\b/g;
const RE_AWAIT_UNCOMMENT = /\/\*\*!__await__\*\//g;
const RE_DEFAULT_EXPORT = /^([\s\S]*?)\b(export\s+default\s*|module.exports\s*=\s*)([\s\S]*?)$/;

const readFile = file => fs.readFileSync(file).toString();
const renderFile = _template(TPL_TESTFILE);

function compileMatcher(label) {
  return new RegExp(label.replace(RE_PARAM_PLACEHOLDER, '(.+)'), 'i');
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
    const prefix = matches[2];
    const steps = matches[3].replace(RE_AWAIT_COMMENT, '/**!__await__*/');

    const sandbox = {};

    vm.createContext(sandbox);
    vm.runInContext(`steps=${steps}`, sandbox);

    const fixtures = Object.keys(sandbox.steps).map(label => {
      let code = sandbox.steps[label].toString().substr(label.length + 2).trim();

      code = code.replace(RE_AWAIT_UNCOMMENT, 'await');

      return {
        name: compileMatcher(label),
        code,
      };
    });

    prev.push({
      filepath: step,
      content: prelude,
      steps: fixtures,
    });

    return prev;
  }, []);
}

function compile(params) {
  params.Language = Yadda.localisation[params.language] || Yadda.localisation.English;
  params.baseDir = params.baseDir || process.cwd();

  const stepMatcher = compileSteps(params);

  compileFeatures(params).forEach(feature => {
    const usedSteps = [];
    const prelude = [];

    feature.scenarios.forEach(scenario => {
      scenario.steps = scenario.steps.map(step => {
        for (let i = 0; i < stepMatcher.length; i += 1) {
          const test = stepMatcher[i];

          for (let j = 0; j < test.steps.length; j += 1) {
            const info = test.steps[j];
            const values = step.match(info.name);

            if (values) {
              if (!usedSteps.includes(test.filepath)) {
                usedSteps.push(test.filepath);
                prelude.push(test.content);
              }

              return {
                data: values.slice(1),
                code: info.code,
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
    }));
  });

  if (params.copy) {
    params.copy.forEach(src => {
      fs.copySync(src, path.join(params.destDir, path.basename(src)));
    });
  }
}

module.exports = compile;
