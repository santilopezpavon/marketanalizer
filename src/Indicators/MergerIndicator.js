import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getMergerIndicator() {
    return MergerIndicator.getInstance();
}

class MergerIndicator {
    static #instance;

    static getInstance() {
        if (!MergerIndicator.#instance) {
            MergerIndicator.#instance = new MergerIndicator()
        }
        return MergerIndicator.#instance;
    }

    setIndicator(candleStickArray, indicatorsArray, propertyName) {
        const diff = candleStickArray.length - indicatorsArray.length;
        for (let j = indicatorsArray.length - 1; j >= 0; j--) {
            const indexCorrelation = j + diff;
            indicatorsArray[j]["indexCandle"] = indexCorrelation;
            candleStickArray[indexCorrelation][propertyName] = indicatorsArray[j];
        }
        
    }
}