import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getTrend() {
    return Trend.getInstance();
}

class Trend {

    static #instance;

    constructor() {
    }

    static getInstance() {
        if (!Trend.#instance) {
            Trend.#instance = new Trend()
        }
        return Trend.#instance;
    }

    getAnalisisTrend(dataArray = []) {
        const numItems = 10;
        const responseObject = {
            forceUpper: null,
            forceDown: null
        };
        let upper = 0;
        let down = 0;
        let incrementalTotal = 0;

        for (let i = dataArray.length - 1; i > (dataArray.length - numItems); i--) {
            if(dataArray[i]["emaIndicator"].uppertrend === true) {
                upper++;
            } else {
                down++;
            }
            incrementalTotal = incrementalTotal + (dataArray[i]["emaIndicator"].diffPercentual);
        }

        const total = (upper + down);
        const forceUpper = upper / total;
        responseObject["forceUpper%"] = forceUpper * 100;
        responseObject["forceDown%"] = (1 - forceUpper) * 100;
        responseObject["meanIncremental%"] = (incrementalTotal / total);
        return responseObject;
    }
}
