import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getDesviation() {
    return Desviation.getInstance();
}

class Desviation {

    static #instance;

    constructor() {
    }

    static getInstance() {
        if (!Desviation.#instance) {
            Desviation.#instance = new Desviation()
        }
        return Desviation.#instance;
    }

    getDesviationAnalisis(dataArray = []) {
        const numItems = 2;
        const lastItem = dataArray[dataArray.length - 1];

        return  {
            underLower: lastItem["bollingerBandsIndicator"].pb < 0,
            upperHigher: lastItem["bollingerBandsIndicator"].pb > 100,
            pb: lastItem["bollingerBandsIndicator"].pb
        };
        console.log(lastItem["bollingerBandsIndicator"].pb);

        /*for (let i = dataArray.length - 1; i > (dataArray.length - numItems); i--) {
            console.log(dataArray[i]["bollingerBandsIndicator"])    
            console.log(dataArray[i]);        
        }

        console.log(responseObject);*/
    }
}
