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
    l: 'lang',
    t: 'steps',
  },
});

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
    srcDir: argv.flags.src,
    destDir: argv.flags.dest,
    copyFrom: toArray(argv.flags.copy),
    stepFiles: toArray(argv.flags.steps),
  });

  if (argv.raw.length) {
    exec([`${argv.flags.dest}/cases`]);
  } else {
    process.stdout.write(`${argv.flags.dest}/cases`);
  }
} catch (e) {
  process.stderr.write(e.message);
  process.exit(1);
}

process.on('SIGINT', () => {
  if (child) {
    process.stdout.write(`\rClosing child process ${child.pid} ...\n`);

    child.kill('SIGINT');
  }

  process.exit();
});
