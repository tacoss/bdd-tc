const wargs = require('wargs');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const pwd = process.cwd();
const dir = path.basename(pwd);

const argv = wargs(process.argv.slice(2), {
  alias: {
    c: 'copy',
    l: 'lang',
    t: 'steps',
  },
});

const SRC = argv._.shift();
const DEST = argv._.shift() || `/tmp/${dir}`;

const USAGE_INFO = `
Usage:
  yadda-testcafe SRC [DEST] [...] -- [ARGS]

Example:
  yadda-testcafe e2e/features -t e2e/steps -- npx testcafe --color

Input/Output:
  SRC          Features files or directory (default: ./features)
  DEST         Directory for generated tests (default: /tmp/${dir})

Options:
  -l, --lang   Yadda language, for l10n parsing
  -c, --copy   Files or directories to copy; it can be multiple
  -t, --steps  Single step file, glob or directory; it can be multiple

`;

if (argv.flags.help) {
  process.stdout.write(USAGE_INFO);
  process.exit();
}

if (!SRC || !fs.existsSync(SRC)) {
  const message = !SRC
    ? 'Missing src'
    : `Invalid src \`${path.relative(pwd, SRC)}\``;

  process.stderr.write(`${message}, use --help for usage info\n`);
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

const { spawn } = require('child_process');

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
  compiler({
    lang: argv.flags.lang,
    srcDir: SRC,
    destDir: DEST,
    copyFrom: toArray(argv.flags.copy),
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
    exec([`${DEST}/cases`]);
  } else {
    process.stdout.write(`${DEST}/cases`);
  }
} catch (e) {
  process.stderr.write(`${e.message}, use --help for usage info\n`);
  process.exit(1);
}

process.on('SIGINT', () => {
  if (child) {
    process.stdout.write(`\rClosing child process ${child.pid} ...\n`);

    child.kill('SIGINT');
  }

  process.exit();
});
