const compiler = require('./compiler');

const destDir = `${__dirname}/e2e`;
const srcDir = `${__dirname}/tests`;
const stepFiles = [`${__dirname}/step.js`];

compiler({
  srcDir,
  destDir,
  stepFiles,
});
