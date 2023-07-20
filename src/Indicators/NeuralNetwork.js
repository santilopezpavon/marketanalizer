import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tf = require('@tensorflow/tfjs-node');
const configuration = require('../../config.json');

export function getNeuralNetwork() {
    return NeuralNetwork.getInstance();
}

class NeuralNetwork {

    static #instance;

    numberItems = 10;

    static getInstance() {
        if (!NeuralNetwork.#instance) {
            NeuralNetwork.#instance = new NeuralNetwork()
        }
        return NeuralNetwork.#instance;
    }

    normalizeData(dataArrayCandleStick = []) {
        let dataPrepared = {
            "high": {
                "values": dataArrayCandleStick.map(a => a.high),
            },
            "low": {
                "values": dataArrayCandleStick.map(a => a.low),
            },
            "close": {
                "values": dataArrayCandleStick.map(a => a.close),
            },
            "volume": {
                "values": dataArrayCandleStick.map(a => a.volume),
            },
            "open": {
                "values": dataArrayCandleStick.map(a => a.open),
            }
        }

        for (const key in dataPrepared) {
            const values = dataPrepared[key].values;
            dataPrepared[key]["max"] = Math.max(...values);
            dataPrepared[key]["min"] = Math.min(...values);
            dataPrepared[key]["norm"] = [];

            for (let j = 0; j < values.length; j++) {
                dataPrepared[key]["norm"].push(
                    (values[j] - dataPrepared[key]["min"]) / (dataPrepared[key]["max"] - dataPrepared[key]["min"])
                );
            }
        }

        return dataPrepared;
    }

    prepareData(dataArrayCandleStick = []) {
        const future = 4;

        let dataPrepared = this.normalizeData(dataArrayCandleStick);




        let inputs = [];
        let outputs = [];
        const items = this.numberItems;

        for (let index = items; index < dataArrayCandleStick.length - items - future; index += items) {

            const ini = index - items;
            const end = index;
            const diff = dataArrayCandleStick[index + future].close - dataArrayCandleStick[index].close;
            let currentOutput = [1, 0];
            if (diff > 0) {
                currentOutput = [0, 1];
            }
            outputs.push(currentOutput);
            let currentInput = [];

            for (let j = ini; j < end; j++) {
                for (const key in dataPrepared) {
                    currentInput.push(dataPrepared[key]["norm"][j]);
                }
            }
            inputs.push(currentInput);
        }

        return {
            "inputs": inputs,
            "outputs": outputs
        }
    }

    async createNeuronalNetwork(dataPrepared = {}, model = null) {      
    
        const xs = dataPrepared.inputs;
        const ys = dataPrepared.outputs;
        const hiddenLayer = 5;

        if(model === null) {
            model = tf.sequential();

            const hidden = tf.layers.dense({
                units: hiddenLayer,
                inputShape: [xs[0].length],
                activation: 'tanh'
            });
    
            model.add(hidden);
           
    
            const output = tf.layers.dense({
                units: 2,
                inputShape: [hiddenLayer],
                activation: 'sigmoid'
            });
    
            model.add(output);
    
            model.compile({
                optimizer: 'adamax',
                loss: 'meanSquaredError'
            });
        }

        

        let inputs = tf.tensor2d(xs);
        let outputs = tf.tensor2d(ys); 

        const configTrain = {
            epochs: 100,
            verbose: 0
        };
       // console.log("entreno");
       // console.log(model);
        const h = await model.fit(inputs, outputs, configTrain)
        console.log(dataPrepared.inputs.length);
        console.log(dataPrepared.inputs[0].length);
        console.log(h.history.loss[0]);
        console.log(h.history.loss[h.history.loss.length - 1]);

        return model;
    }

    async predict(dataArrayCandleStick = [], neuralNetworkInstance = null) {

        let dataPrepared = this.normalizeData(dataArrayCandleStick);
        /*const xs = dataPrepared.inputs;
        const numberItems = this.numberItems;



        let inputs = tf.tensor2d(xs);*/
        let inputs = [];
        const items = this.numberItems;
        const index = dataArrayCandleStick.length - 1;
        const ini = index - items + 2;

        for (let j = ini; j <= index; j++) {
            for (const key in dataPrepared) {
                inputs.push(dataPrepared[key]["norm"][j]);
            }
        }

        console.log(inputs);
        

    }


}