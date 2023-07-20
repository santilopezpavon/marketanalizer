import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getEMA() {
    return EMA.getInstance();
}

class EMA {

    static #instance;

    #emaIndicator;

    constructor(emaIndicator) {
        this.#emaIndicator = emaIndicator;
    }

    static getInstance() {
        if (!EMA.#instance) {
            const emaIndicator = require('technicalindicators').EMA;
            EMA.#instance = new EMA(emaIndicator)
        }
        return EMA.#instance;
    }

    getEMACross(dataArray = [], emaShort = 50, emaLong = 150) {
        const values = dataArray.map(a => a["close"]);
        

        const shortEma = this.#emaIndicator.calculate({"period": emaShort, "values":values});                 
        const longEma = this.#emaIndicator.calculate({"period": emaLong, "values":values});                 
        const crossObject = new Array(longEma.length);

        for (let i = 1; i <= longEma.length; i++) {
            crossObject[longEma.length - i] = {
                "short": shortEma[shortEma.length - i],
                "long": longEma[longEma.length - i],
                "uppertrend": shortEma[shortEma.length - i] > longEma[longEma.length - i],
                "downtrend": shortEma[shortEma.length - i] <= longEma[longEma.length - i],
                "diffPercentual": ((shortEma[shortEma.length - i] - longEma[longEma.length - i]) / longEma[longEma.length - i]) * 100
            };
        }

        return crossObject;

    }
}