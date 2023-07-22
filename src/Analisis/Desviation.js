import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getDesviation() {
    return Desviation.getInstance();
}

class Desviation {

    static #instance;

    firstBollinguer = 'bollingerBandsIndicator';
    secondBollinguer = 'bollingerBandsIndicatorSt4';
    thirdBollinguer = 'bollingerBandsIndicatorSt5';
    cuartBollinguer = 'bollingerBandsIndicatorSt6';

    constructor() {
    }

    static getInstance() {
        if (!Desviation.#instance) {
            Desviation.#instance = new Desviation()
        }
        return Desviation.#instance;
    }

    getDesviationAnalisis(dataArray = []) {
        const lastItem = dataArray[dataArray.length - 1];

        return  {
            underLower: lastItem[this.firstBollinguer].pb < 0,
            upperHigher: lastItem[this.firstBollinguer].pb > 100,
            pb: lastItem[this.firstBollinguer].pb,
            "std3": lastItem[this.firstBollinguer],
            "std4": lastItem[this.secondBollinguer],
            "std5": lastItem[this.thirdBollinguer],  
            "std6": lastItem[this.cuartBollinguer],           
        };
    }

    
    getBreaksStdAnalysis(dataArray = []) {
        const lastPos = dataArray.length - 1;
        let positionLastBreak = null;
        let breakInformation = {
            "candleBreakPositon": null,
            "breakBollinguerData": null,
            "lapsedTime": null 
        };

        for (let i = lastPos; i >= 0 ; i--) {
            if(
                dataArray[i].hasOwnProperty("bollingerBandsIndicatorSt32") && 
                dataArray[i]["bollingerBandsIndicatorSt32"].pb < 0
            ) {
                positionLastBreak = i;
                break;
            }
        }

        if(positionLastBreak === null) {return false;}

       
        breakInformation = {
            "candleBreakPositon": positionLastBreak,
            "breakBollinguerData": dataArray[positionLastBreak]["bollingerBandsIndicatorSt32"],
            "lapsedTime": dataArray.length - positionLastBreak
        }

        if(
            dataArray[positionLastBreak]["bollingerBandsIndicatorSt4"].pb < 0
        ) {
            breakInformation["breakBollinguerData"] = dataArray[positionLastBreak]["bollingerBandsIndicatorSt4"];
        } 

        if(
            dataArray[positionLastBreak]["bollingerBandsIndicatorSt5"].pb < 0
        ) {
            breakInformation["breakBollinguerData"] = dataArray[positionLastBreak]["bollingerBandsIndicatorSt5"];
        } 

        if(
            dataArray[positionLastBreak]["bollingerBandsIndicatorSt6"].pb < 0
        ) {
            breakInformation["breakBollinguerData"] = dataArray[positionLastBreak]["bollingerBandsIndicatorSt6"];
        } 

        breakInformation["breakBollinguerData"]["pointMean"] =  (breakInformation["breakBollinguerData"].middle + breakInformation["breakBollinguerData"].lower) / 2

        return breakInformation;
    }
}
