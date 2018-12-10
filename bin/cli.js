const { spawn } = require('child_process');

const wargs = require('wargs');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const pkg = require('../package.json');

const bin = Object.keys(pkg.bin)[0];
const pwd = process.cwd();

const argv = wargs(process.argv.slice(2), {
  alias: {
    l: 'lang',
    a: 'tags',
    t: 'steps',
  },
});

const USAGE_INFO = `
Usage:
  ${bin} SRC [DEST] [...] -- [ARGS]

Example:
  ${bin} e2e/features -- npx testcafe --color

Input/Output:
  SRC          Features files or directory (default: ./features)
  DEST         Directory for generated cases (default: ./generated)

  If only SRC is provided, then DEST and --steps are derived from there

  Extra ARGS are used, if provided, to spawn a child process with DEST appended

Options:
  -l, --lang   Yadda language, for l10n parsing
  -a, --tags   Build only tests with these tags; it can be multiple
  -t, --steps  Single step file, glob or directory; it can be multiple

`;

if (argv.flags.help) {
  process.stdout.write(USAGE_INFO);
  process.exit();
}

const SRC = (argv._[0] && path.resolve(argv._[0])) || pwd;
const DEST = argv._[1] || path.resolve(SRC, '../generated');

if (argv._.length === 1 && !argv.flags.steps) {
  argv.flags.steps = argv.flags.s = path.resolve(SRC, '../steps');
}

if (!SRC || !fs.existsSync(SRC)) {
  const message = !SRC
    ? 'Missing src'
    : `Invalid src \`${path.relative(pwd, SRC)}\``;

  process.stderr.write(`${message}; use --help for usage info\n`);
  process.exit(1);
}

const onClose = process.version.split('.')[1] === '6' ? 'exit' : 'close';

let child;

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

function exec(sources) {
  const cmd = argv.raw.concat(sources);

  process.stdout.write(`\rExecuting \`${cmd.join(' ')}\` ...\n`);

  if (child) {
    child.kill('SIGINT');
  }

  child = spawn(cmd[0], cmd.slice(1), {
    cwd: process.cwd(),
    detached: true,
  });

  child.stdout.pipe(process.stdout);

  const errors = [];

  child.stderr.on('data', data => {
    const line = data.toString().trim();

    if (line) {
      errors.push(line);
    }
  });

  child.on(onClose, exitCode => {
    if (errors.length) {
      process.stderr.write(errors.join(''));
    }

    process.exit(exitCode);
  });
}

const compiler = require('../lib/compiler');

try {
  if (fs.existsSync(DEST)) {
    const rimraf = require('rimraf');

    rimraf.sync(DEST);
  }

  compiler({
    lang: argv.flags.lang,
    srcDir: SRC,
    destDir: DEST,
    useTags: toArray(argv.flags.tags),
    stepFiles: toArray(argv.flags.steps).reduce((prev, cur) => {
      if (fs.existsSync(cur) && fs.statSync(cur).isDirectory()) {
        glob.sync('*.js', { cwd: cur }).forEach(file => {
          prev.push(path.join(cur, file));
        });
      } else {
        prev.push(cur);
      }

      return prev;
    }, []),
  });

  if (argv.raw.length) {
    exec([DEST]);
  } else {
    process.stdout.write(DEST);
  }
} catch (e) {
  process.stderr.write(`${e.message}; use --help for usage info\n`);
  process.exit(1);
}

process.on('SIGINT', () => {
  if (child) {
    process.stdout.write(`\rClosing child process ${child.pid} ...\n`);

    child.kill('SIGINT');
  }

  process.exit();
});
