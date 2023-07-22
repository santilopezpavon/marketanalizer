import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const configuration = require('../../config.json');

import { getCoinsInformation } from "../Information/CoinsInformation.js"
import { getAO } from "../Indicators/AO.js"
import { getMergerIndicator } from "../Indicators/MergerIndicator.js"
import { getSound } from "../Action/Sound.js"
import { getDivergence } from "../Analisis/Divergence.js"
import { getTrend } from "../Analisis/Trend.js"
import { getDesviation } from "../Analisis/Desviation.js"

import { getEMA } from "../Indicators/EMA.js"
import { getBollingerBands } from "../Indicators/BollingerBands.js"

export function getBrain() {
    return Brain.getInstance();
}

class Brain {
    static #instance;
    state = {
        "pairsMercadoEntrar": [],
        "pairsMercadoSalir": []
    };

    coinsInfo = getCoinsInformation();
    ao = getAO();
    mergeIndicators = getMergerIndicator();
    sound = getSound();
    ema = getEMA();
    bollingerBands = getBollingerBands();

    static getInstance() {
        if (!Brain.#instance) {
            Brain.#instance = new Brain()
        }
        return Brain.#instance;
    }

    async processBrain(pairs = []) {
        let results = {};
        for (let index = 0; index < pairs.length; index++) {
            try {
                const pair = pairs[index];
                results[pair] = await this.analisePair(pair); 
            } catch (error) {console.log(error);}
        }

        const responseCurrent = {};
        
        for (const key in results) {
            responseCurrent[key] = {
                ...this.marketWithDivergences(results[key]),
                ...this.narketHealth(results[key]),
                ...this.marketAlteredPrice(results[key])
            };           
        }

        return responseCurrent;
    }

    async executeBrain(pairs = []) {
        const responseCurrent = await this.processBrain(pairs);

        let pairsMercadoEntrar = [];
        let pairsMercadoSalir = [];

        for (const key in responseCurrent) {
            responseCurrent[key]["actuacion"] = 'neutral';

            const currentDataPairAnalisis = responseCurrent[key];
            if(
                currentDataPairAnalisis["marketTrend"] == 'upper' && 
                currentDataPairAnalisis["divergence"] == 'upper' && 
                currentDataPairAnalisis["lapsoDivergencia"] < 6
            )  {
                pairsMercadoEntrar.push(key);
                responseCurrent[key]["actuacion"] = 'entrar';
            } else if(
                currentDataPairAnalisis["priceValor"] == 'price underrated'
            )  {
                pairsMercadoEntrar.push(key);
                responseCurrent[key]["actuacion"] = 'entrar';
            }

            if(
                (currentDataPairAnalisis["marketTrend"] == 'down' || currentDataPairAnalisis["divergence"] == 'down') 
            )  {
                pairsMercadoSalir.push(key);
                responseCurrent[key]["actuacion"] = 'salir';
            } else if(
                currentDataPairAnalisis["priceValor"] == 'price overrated'
            )  {
                pairsMercadoSalir.push(key);
                responseCurrent[key]["actuacion"] = 'salir';
            }
        }

        console.table(responseCurrent);


        let alarm = false;

        if(
            this.state.pairsMercadoEntrar.length > 0 || 
            this.state.pairsMercadoSalir.length > 0
        ) {
            for (let i = 0; i < pairsMercadoEntrar.length; i++) {
                if(!this.state.pairsMercadoEntrar.includes(pairsMercadoEntrar[i])) {
                    alarm = true;
                    break;
                }               
            }
            for (let i = 0; i < pairsMercadoSalir.length; i++) {
                if(!this.state.pairsMercadoSalir.includes(pairsMercadoSalir[i])) {
                    alarm = true;
                    break;
                }               
            }           
        }

        if(
            this.state.pairsMercadoEntrar.length == 0 && 
            this.state.pairsMercadoSalir.length == 0
        ) {
            alarm = true
        }

       

        this.state = {
            "pairsMercadoEntrar": pairsMercadoEntrar.slice(),
            "pairsMercadoSalir": pairsMercadoSalir.slice()
        }

        if(alarm == true && pairsMercadoEntrar.length) {            
            await this.sound.getSoundAlertUpMarket();            
        } else  if(alarm == true && pairsMercadoSalir.length) {            
            await this.sound.getSoundAlertDownMarket();            
        }
    }

    marketWithDivergences(response) {
        let typeDivergence = "neutral";
        let priceInDivergence = null;
        let priceHight = null;
        let oscilatorVariation = null;
        let lapsoDivergencia = null;

        if(response.divergencias["divergenciaAlcista"] === true) {
            typeDivergence = 'upper';
            priceInDivergence = response.divergencias.precioEnLaDivergencia;
            priceHight = response.divergencias.precioMasAlto;
            oscilatorVariation = response.divergencias["oscilatorVariacion%"];
            lapsoDivergencia = response.divergencias["lapsoDivergencia"];
        }else if(response.divergencias["divergenciaBajista"] === true) {
            typeDivergence = 'down';
            priceInDivergence = response.divergencias.precioEnLaDivergencia;
            priceHight = response.divergencias.precioMasAlto;
            oscilatorVariation = response.divergencias["oscilatorVariacion%"];   
            lapsoDivergencia = response.divergencias["lapsoDivergencia"];         
        }

        return {
            "divergence": typeDivergence,
            "priceInDivergence": priceInDivergence,
            "priceHight": priceHight,
            "oscilatorVariation": oscilatorVariation,
            "lapsoDivergencia": lapsoDivergencia
        };
    }

    narketHealth(response) {
        let market = "neutral";
        if(response.trend["forceUpper%"] > 90) {
            market = 'upper';
        } else if(response.trend["forceDown%"] > 90) {
            market = "down";
        }

   
        return { "marketTrend": market, "incremental%": response.trend["meanIncremental%"], "stddev": response.trend.stddesv}
    }

    marketAlteredPrice(response) {
        let market = "price neutral";
        if(response.desviation["underLower"] === true) {
            market = 'price underrated';
        } else if(response.desviation["upperHigher"] === true) {
            market = "price overrated";
        }
        return {"priceValor": market}
    }

    async pricesForSell(data) {
        let quibreMinimo = null;
        let quibreMinimoTocado = 0;
        let quibrePosicion = null;
        let quibrePosicionLapso = null;
        let precioCompraQuiebre = null;
        let potencialGananciaQuiebre = null;
        
        for (let i = data.length - 1; i > 0; i--) {
            const element = data[i];
            if(
                element.hasOwnProperty("bollingerBandsIndicator") &&
                element.bollingerBandsIndicator.pb < 0
            )  {
                quibrePosicion = i;
                quibreMinimo = element["bollingerBandsIndicator"].lower;
                quibrePosicionLapso = data.length - quibrePosicion
                precioCompraQuiebre = data[quibrePosicion].low;
                potencialGananciaQuiebre = (quibreMinimo - precioCompraQuiebre) / precioCompraQuiebre;
                break;
            }
        }

        if(quibrePosicion !== null) {
            for (let i = data.length - 1; i > quibrePosicion + 5; i--) {
                if(
                    data[i].high  > quibreMinimo 
                )  {
                    quibreMinimoTocado++;                    
                }
            }
        }

        return {
            "quibreMinimoTocado": quibreMinimoTocado,
            "quibreMinimo": quibreMinimo,
            "quibrePosicionLapso": quibrePosicionLapso,
            "precioCompraQuiebre": precioCompraQuiebre,            
            "precioVentaQuiebre": quibreMinimo,
            "potencialGananciaQuiebre": potencialGananciaQuiebre,

            "currentPrice": data[data.length - 1].close,
            "current-1": data[data.length - 2].high,
            "current-2": data[data.length - 3].high,
            "current-3": data[data.length - 4].high,

            "current-1%": ((data[data.length - 2].high - data[data.length - 1].close) / data[data.length - 1].close) * 100,
            "current-2%": ((data[data.length - 3].high - data[data.length - 1].close) / data[data.length - 1].close)* 100,
            "current-3%": ((data[data.length - 4].high - data[data.length - 1].close) / data[data.length - 1].close)* 100
        };
    }

    async analisePair(pair) {
        const data = await this.coinsInfo.getHistoricalData(pair, "1m");

        const aoResults = this.ao.getAwesomeOscillator(data);
        const bollingerBandsIndicator = this.bollingerBands.getBollingerBands(data);
        const bollingerBandsIndicatorSt32 = this.bollingerBands.getBollingerBands(data, 150, 3.2);

        const bollingerBandsIndicatorSt4 = this.bollingerBands.getBollingerBands(data, 150, 4);
        const bollingerBandsIndicatorSt5 = this.bollingerBands.getBollingerBands(data, 150, 5);
        const bollingerBandsIndicatorSt6 = this.bollingerBands.getBollingerBands(data, 150, 6);

        const dataLong = await this.coinsInfo.getHistoricalData(pair, "15m");
        const emaData = this.ema.getEMACross(dataLong);
       
        this.mergeIndicators.setIndicator(data, bollingerBandsIndicator, "bollingerBandsIndicator");
        this.mergeIndicators.setIndicator(data, aoResults, "awesomeOscilator");
        this.mergeIndicators.setIndicator(data, emaData, "emaIndicator");

        this.mergeIndicators.setIndicator(data, bollingerBandsIndicatorSt6, "bollingerBandsIndicatorSt6");
        this.mergeIndicators.setIndicator(data, bollingerBandsIndicatorSt4, "bollingerBandsIndicatorSt4");
        this.mergeIndicators.setIndicator(data, bollingerBandsIndicatorSt5, "bollingerBandsIndicatorSt5");
        this.mergeIndicators.setIndicator(data, bollingerBandsIndicatorSt32, "bollingerBandsIndicatorSt32");

        
        const dataPrices = await this.pricesForSell(data);

        //this.mergeIndicators.setIndicator(data, dataPrices, "emaIndicator");


        return {
            "divergencias": getDivergence().analisisAoDivergences(data),
            "trend": getTrend().getAnalisisTrend(data),
            //"desviation": getDesviation().getDesviationAnalisis(data),
            "breaksStd": getDesviation().getBreaksStdAnalysis(data),
            "dataPrices": dataPrices
        };
            
    }


}