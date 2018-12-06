const wargs = require('wargs');

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

  process.stdout.write(argv.flags.dest);
} catch (e) {
  process.stderr.write(e.message);
  process.exit(1);
}
