import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { getBrain } from "./src/Brain/Brain.js"
const configuration = require('./config.json');

const pairs = configuration.pairs;
const minutes = configuration.intervalMinutes;


init(pairs);
setInterval(function () {
  init(pairs);
}, minutes * 60 * 1000);


async function init(pairs) {
  console.log("EJECUTO");
  const brain = getBrain();
  brain.executeBrain(
    pairs
  );
}

