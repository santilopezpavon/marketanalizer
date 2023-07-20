import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getBollingerBands() {
    return BollingerBands.getInstance();
}

class BollingerBands {

    static #instance;

    #bollingerBands;

    constructor(bollingerBands) {
        this.#bollingerBands = bollingerBands;
    }

    static getInstance() {
        if (!BollingerBands.#instance) {
            const bollingerBands = require('technicalindicators').BollingerBands;
            BollingerBands.#instance = new BollingerBands(bollingerBands)
        }
        return BollingerBands.#instance;
    }

    getBollingerBands(dataArray = [], period = 150, stdDev = 3) {
        var input = {
            period : period, 
            values : dataArray.map(a => a["close"]) ,
            stdDev : stdDev               
        }
        return this.#bollingerBands.calculate(input);

    }
}