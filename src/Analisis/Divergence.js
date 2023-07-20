export function getDivergence() {
    return Divergence.getInstance();
}

class Divergence {

    static #instance;

    observerMax = 20;

    static getInstance() {
        if (!Divergence.#instance) {
            Divergence.#instance = new Divergence()
        }
        return Divergence.#instance;
    }

    analisisAoDivergences(data) {
        
        const observerMax = this.observerMax;

        let results = {
            "divergenciaAlcista":  false,
            "divergenciaBajista":  false,
            "precioEnLaDivergencia": null, 
            "precioMasAlto": null,
        }

        for (let index = data.length - 1; (data.length - observerMax) <= index; index--) {
            const element = data[index];
            if(
                element.hasOwnProperty("awesomeOscilator") && 
                element["awesomeOscilator"].posibleDivergence !== false
            ) {
                // Desfase entre indicador y velas.
                const diff = element["awesomeOscilator"].indexCandle - element["awesomeOscilator"].indexIndicator;

            
                const positionPrevIndicator = element["awesomeOscilator"].posibleDivergence.indexIndicatorPrev;
                
                // Encontrar la vela de la divergencia
                const prevCandle = data[positionPrevIndicator + diff];
                const currentCandle = data[index];
             
                const prevCandlePrice = prevCandle.high;
                const currentCandlePrice = currentCandle.high;

                const diffPrice = currentCandlePrice - prevCandlePrice;

                const oscilatorCurrent = currentCandle.awesomeOscilator;
                const oscilatorPrev = prevCandle.awesomeOscilator;

                
                

                let hayDivergencia = false;
                if(diffPrice < 0 && element["awesomeOscilator"].posibleDivergence.type == 'alcista') {
                    results["divergenciaAlcista"] = true;
                    hayDivergencia = true;
                }

                if(diffPrice > 0 && element["awesomeOscilator"].posibleDivergence.type == 'bajista') {
                    results["divergenciaBajista"] = true;
                    hayDivergencia = true;
                }

                if(hayDivergencia === true) {
                    results["precioEnLaDivergencia"] = data[index].close;
                    results["precioMasAlto"] =  this.#precioMasAltoRangoPosiciones(data, index - 3, index);
                    results["variacionPrecio%"] = (results["precioMasAlto"] - results["precioEnLaDivergencia"]) / results["precioEnLaDivergencia"];
                    results["variacionPrecio%"] =(results["variacionPrecio%"].toFixed(5)) * 100;

                    results["lapsoDivergencia"] = data.length - index;

                    results["oscilatorVariacion%"] = (oscilatorCurrent.value - oscilatorPrev.value) / oscilatorPrev.value;
                    results["oscilatorVariacion%"] = Math.abs((results["oscilatorVariacion%"].toFixed(5)) * 100);
                }




                break;
            }            
        }

        return results;
    }

    #precioMasAltoRangoPosiciones(data, init, end) {
        const arrayPrices = [];
        for (let index = init; index <= end; index++) {
            arrayPrices.push(data[index].high);            
        }
        return Math.max(...arrayPrices);
    }    
}

