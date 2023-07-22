import { getBrain } from "../Brain/Brain.js"

export function getTrader() {
    return Trader.getInstance();
}

class Trader {

    static #instance;

    brain = getBrain();

    static getInstance() {
        if (!Trader.#instance) {
            Trader.#instance = new Trader()
        }
        return Trader.#instance;
    }    

    async showInformationPairs(pairs) {
        let resultsAnalisys = {};
        for (let index = 0; index < pairs.length; index++) {
            try {
                const pair = pairs[index];
                const pairAnalized = await this.brain.analisePair(pair);
                resultsAnalisys[pair] = this.prepareDataForPrint(pairAnalized);   
            } catch (error) {console.log(error);}
        }
        return resultsAnalisys;
    }

    async checkOportunities(pairs) {
        let resultsAnalisys = {};
        for (let index = 0; index < pairs.length; index++) {
            try {
                const pair = pairs[index];
                const pairAnalized = await this.brain.analisePair(pair);
                resultsAnalisys[pair] = this.prepareDataForPrint(pairAnalized);   
            } catch (error) {console.log(error);}
        }
        return resultsAnalisys;
    }
    
    async checkInfoPairStatus(pair) {       
        try {
            const pairAnalysis = await this.brain.analisePair(pair);    
            return this.prepareDataForPrint(pairAnalysis);
        } catch (error) {console.log(error);}
    }   

    alertEntryCriteria(pairsAnalizedPrinted) {
        let output = {
            "alert": false,
            "pairs": [],
            "dataAnalizedSelected": {}
        };

        for (const key in pairsAnalizedPrinted) {
            const typePari = pairsAnalizedPrinted[key].type;
            if(
                (typePari.includes("break") || typePari.includes("divUpp")) &&
                typePari.includes("upp") 
            ) {
                output.dataAnalizedSelected[key] = pairsAnalizedPrinted[key];
                output.pairs.push(key);
            }
        }

        if(output.pairs.length > 0) {
            output.alert = true;
        }
        return output;
    }

    alertOutCriteria(pairsAnalizedPrinted) {
        let output = {
            "alert": false,
            "pairs": [],
            "dataAnalizedSelected": {}
        };


        for (const key in pairsAnalizedPrinted) {
            const typePari = pairsAnalizedPrinted[key].type;
            if(
                (typePari.includes("down") || typePari.includes("divDown")) 
            ) {
                output.dataAnalizedSelected[key] = pairsAnalizedPrinted[key];
                output.pairs.push(key);
            }
        }

        if(output.pairs.length > 0) {
            output.alert = true;
        }
        return output;
    }

    putTagInPair(pairAnalized) {
        let tags = [];
        if(
            pairAnalized.forceUpp == 100 && 
            pairAnalized.trendMean > 0
        ) {
            tags.push("upp")
        } else {
            tags.push("down")
        }
        if(
            pairAnalized.lapsedBreak != null && 
            pairAnalized.lapsedBreak <= 30
        ) {
            tags.push("break")
        } 

        if(
            pairAnalized.divUpp == true && 
            pairAnalized.lapsoDiv <= 15
        ) {
            tags.push("divUpp")
        } 

        if(
            pairAnalized.divDown == true && 
            pairAnalized.lapsoDiv <= 80
        ) {
            tags.push("divDown")
        } 
        return tags;
    }

    prepareDataForPrint(pairAnalized) {
        let dataAnalizedToPrint = {
            "precioDiv": null,
            "lapsoDiv": null,
            "lapsedBreak": null,
            "lowerBreak": null,
            "middleBreak": null,
            "pointMeanBreak": null,
            "price": pairAnalized.dataPrices.currentPrice
        };       

            dataAnalizedToPrint["divUpp"] = pairAnalized.divergencias.divergenciaAlcista;
            dataAnalizedToPrint["divDown"] = pairAnalized.divergencias.divergenciaBajista;
            
            dataAnalizedToPrint["forceUpp"] = pairAnalized.trend["forceUpper%"];
            dataAnalizedToPrint["trendMean"] = pairAnalized.trend["meanIncremental%"];
            dataAnalizedToPrint["stddesv"] = pairAnalized.trend["stddesv"];
        
            if(
                pairAnalized.divergencias.divergenciaAlcista === true ||  
                pairAnalized.divergencias.divergenciaBajista === true
            ) {
                dataAnalizedToPrint["precioDiv"] = pairAnalized.divergencias.precioEnLaDivergencia;
                dataAnalizedToPrint["lapsoDiv"] = pairAnalized.divergencias.lapsoDivergencia;
            }
        
            if(
                pairAnalized.breaksStd !== false 
            ) {
                dataAnalizedToPrint["lapsedBreak"] = pairAnalized.breaksStd.lapsedTime;
                dataAnalizedToPrint["lowerBreak"] = pairAnalized.breaksStd.breakBollinguerData.lower;
                dataAnalizedToPrint["middleBreak"] = pairAnalized.breaksStd.breakBollinguerData.middle;
                dataAnalizedToPrint["pointMeanBreak"] = pairAnalized.breaksStd.breakBollinguerData.pointMean;
            } 

            for (const key in dataAnalizedToPrint) {
                dataAnalizedToPrint[key] = this.procesedDataNumber(dataAnalizedToPrint[key]);
            }

            dataAnalizedToPrint["type"] = this.putTagInPair(dataAnalizedToPrint);
            return  dataAnalizedToPrint;
    }

    procesedDataNumber(valueData) {       
        if(this.isFloat(valueData)){
            return parseFloat(valueData.toFixed(5));
        }
        return valueData;

    }
    isFloat(x) { return !!(x % 1); }    
}