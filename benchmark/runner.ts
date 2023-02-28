import { ChildProcess, spawn } from 'child_process';
import fsp from 'fs/promises';

import { runCPUBenchmark } from './benchmark-cpu';
import { runYDocBenchmark as runYDocBinarySizeBenchmark } from './benchmark-ydoc-bin-size';

const previewURL = `http://127.0.0.1:4173/`;

const startPlaygroundPreview = (timeout = 30000) => {
  console.log('starting playground preview ...');
  const child = spawn('pnpm', ['preview:playground'], {});
  let started = false;
  return new Promise<ChildProcess>((resolve, reject) => {
    setTimeout(() => {
      if (!started) {
        reject('Start playground preview timeout');
      }
    }, timeout);

    // wait until child output "http://127.0.0.1:4173/", which means the preview is ready
    child.stdout?.on('data', data => {
      const output = data.toString();
      console.log('stdout: data', output);
      if (output.includes('ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL')) {
        reject('Failed to start playground preview');
        child.kill();
      } else if (output.includes(previewURL)) {
        started = true;
        resolve(child);
        console.log('playground preview started');
      }
    });

    child.stderr?.on('data', data => {
      console.error('stderr: data', data.toString());
    });

    child.on('close', () => {
      console.log('playground preview exited');
    });

    process.on('exit', function () {
      console.log('killing child process ...');
      child.kill();
    });
  });
};

async function main() {
  try {
    await startPlaygroundPreview();

    if (process.env.CPU_BENCHMARK) {
      await runCPUBenchmark();
    }

    const info = await runYDocBinarySizeBenchmark();
    const ratio = ((info.binSize / info.jsonSize) * 100).toFixed(1);
    console.log(`YDoc binary size is ${ratio}% about the JSON size`);
    await fsp.writeFile(
      'bench-mark-size.out',
      `BIN_SIZE=${info.binSize}\nJSON_SIZE=${info.jsonSize}\nRATIO=${ratio}`
    );
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
