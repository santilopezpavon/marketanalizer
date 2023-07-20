import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getAO() {
    return AO.getInstance();
}

class AO {

    static #instance;

    #awesomeOscilator;

    constructor(awesomeOscillator) {
        this.#awesomeOscilator = awesomeOscillator;
    }

    static getInstance() {
        if (!AO.#instance) {
            const awesomeOscillator = require('technicalindicators').AwesomeOscillator;
            AO.#instance = new AO(awesomeOscillator)
        }
        return AO.#instance;
    }

    getAwesomeOscillator(dataArray = [], fastPeriod = 5, slowPeriod = 34, decimals = 5) {
        let input = {
            high: dataArray.map(a => a["high"]),
            low: dataArray.map(a => a["low"]),
            fastPeriod: fastPeriod,
            slowPeriod: slowPeriod,
            format: (a) => parseFloat(a.toFixed(decimals))
        }
        const calculate = this.#awesomeOscilator.calculate(input);
        let responseAo = [];

        for (let index = 0; index < calculate.length; index++) {
            const element = calculate[index];
            
            let objectToAo = {
                "value": element,
                "positive": element > 0,
                "negative": element < 0,
                "neutral": element == 0,
                "color": undefined,
                "indexIndicator": index
            };

            // COLOR BAR.
            if(index > 0) {
                if(calculate[index - 1] > element) {
                    objectToAo["color"] = 'red';
                } else {
                    objectToAo["color"] = 'green';
                }
            }
            responseAo.push(objectToAo);
            
        }

        this.setCimsInAO(responseAo);     
        this.setPosibleDivergences(responseAo);
       
        return responseAo;
    }

    setCimsInAO(responseAo) {
        const cimsInterval = 4;
        for (let index = cimsInterval; index < (responseAo.length - cimsInterval); index++) {
            // Previous Red
            let previousRed = true;
            for (let j = index - 1; j > (index - cimsInterval); j--) {
                if(responseAo[j].color !== 'red') {
                    previousRed = false;
                    break;
                }
            }

            // Next Green
            let previousGreen = true;
            for (let j = index + 1; j < (index + cimsInterval); j++) {
                if(responseAo[j].color !== 'green') {
                    previousGreen = false;
                    break;
                }
            }
            
            if(previousGreen === true && previousRed === true)
            {  
                responseAo[index]["cim"] = true; 
            } else {
                responseAo[index]["cim"] = false; 

            }
        }       
    }

    setPosibleDivergences(responseAo) {
        let posibleDivergenceIndex = null;
        const numBarsDivergence = 20;

        for (let index = responseAo.length - 1; index >= 0; index--) {
            responseAo[index]["posibleDivergence"] = false;
            if(responseAo[index].cim === true && (index - numBarsDivergence) >= 0) {
                for (let j = index - 3; j > index - numBarsDivergence; j--) {
                    if(
                        responseAo[j].cim === true && 
                        responseAo[j].value < 0 && 
                        responseAo[index].value < 0 &&
                        responseAo[index].value > responseAo[j].value
                    ) {
                        responseAo[index]["posibleDivergence"] = {
                            "type": "alcista",
                            "indexIndicator": index,
                            "indexIndicatorPrev": j
                        }  
                        break;
                    }

                    if(
                        responseAo[j].cim === true && 
                        responseAo[j].value > 0 && 
                        responseAo[index].value > 0 &&
                        responseAo[index].value < responseAo[j].value
                    ) {
                        responseAo[index]["posibleDivergence"] = {
                            "type": "bajista",
                            "indexIndicator": index,
                            "indexIndicatorPrev": j
                        } 
                        break;
                    }
                }
            }
        }

        
    }


}