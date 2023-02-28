import { ChildProcess, spawn } from 'child_process';
import fsp from 'fs/promises';

import { runCPUBenchmark } from './benchmark-cpu';
import { runYDocBenchmark as runYDocBinarySizeBenchmark } from './benchmark-ydoc-bin-size';

const previewURL = `http://127.0.0.1:4173/`;

const startPlaygroundPreview = () => {
  console.log('starting playground preview ...');
  const child = spawn('pnpm', ['preview:playground'], {});
  return new Promise<ChildProcess>((resolve, reject) => {
    setTimeout(() => {
      // todo: check if the service is really up
      console.log('playground preview started');
      resolve(child);
    }, 1000);
    // wait until child output "http://127.0.0.1:4173/", which means the preview is ready
    child.stdout?.on('data', data => {
      console.error('stderr: data', data.toString());
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
    process.exit(1);
  }
  process.exit();
}

main();
