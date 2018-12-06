const wargs = require('wargs');
const glob = require('glob');

const pwd = process.cwd();

const argv = wargs(process.argv.slice(2), {
  default: {
    src: `${pwd}/tests/e2e`,
    dest: `${pwd}/generated`,
  },
  alias: {
    s: 'src',
    d: 'dest',
    c: 'copy',
    t: 'steps',
  },
});

function toArray(value) {
  if (!value) {
    return [];
  }

  if (typeof value === 'string' && /[{*}]/.test(value)) {
    return glob.sync(value);
  }

  return !Array.isArray(value)
    ? [value]
    : value;
}

try {
  const compiler = require('../lib/compiler');

  compiler({
    srcDir: argv.flags.src,
    destDir: argv.flags.dest,
    copyFrom: toArray(argv.flags.copy),
    stepFiles: toArray(argv.flags.steps),
  });

  process.stdout.write(`${argv.flags.dest}/cases`);
} catch (e) {
  process.stderr.write(e.message);
  process.exit(1);
}
