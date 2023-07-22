import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { getTrader } from "./src/Trader/Trader.js"
const configuration = require('./config.json');
import { getSound } from "./src/Action/Sound.js"
import { getCoinsInformation } from "./src/Information/CoinsInformation.js"


const pairs = configuration.pairs;
const minutes = configuration.intervalMinutes;
let memory = {
    "pairs": []
};

const traderInstance = getTrader();
let pair = null;
let command = null;
if(typeof process.argv[2] !== 'undefined') {
    command = process.argv[2].toUpperCase();
}
if(typeof process.argv[3] !== 'undefined') {
    pair = process.argv[3].toUpperCase();
}

let output = null;
switch (command) {

    case "CHECK":
        let statusCryptos = await traderInstance.checkOportunities(pairs);
        console.table(statusCryptos);
        break;

    case "ALLCHECK":
        const info = getCoinsInformation();
        const allcheck = await info.getAllAssetsByQuoteAsset("BUSD", 200);
        let statusCryptos2 = await traderInstance.checkOportunities(allcheck);
        console.table(statusCryptos2);

        const alert = traderInstance.alertEntryCriteria(statusCryptos2);
        if(alert.alert === true) {                   
            console.log(alert.pairs);
            getSound().getSoundAlertUpMarket();
        }
        break;

    case "ALLSEARCH":
        intervalFunction(async function () {
            const info = getCoinsInformation();
            const pairsAll = await info.getAllAssetsByQuoteAsset("BUSD", 50);
    
            let statusCryptos = await traderInstance.checkOportunities(pairsAll);
            console.table(statusCryptos);

            /*for (const key in statusCryptos) {
                if (statusCryptos[key].hasOwnProperty("trendMean")) {
                    getSound().getSoundAlertUpMarket();                    
                }
            }*/
        });
        break;

    case "CONTROL":
        const data = [];
        let min = null;
        intervalFunction(async function () {
            console.log("Precio compra: " + process.argv[4]);
            let statusCryptos = await traderInstance.checkInfoPairStatus(pair);
            statusCryptos["min"] = false;
            if(min === null || min > statusCryptos["trendMean"]) {
                min = statusCryptos["trendMean"];
                statusCryptos["min"] = true;
            }
            data.push(statusCryptos);           
            console.table(data);

            let dataToAlertParam = {};
            dataToAlertParam[pair] = statusCryptos;
            const alert = traderInstance.alertOutCriteria(dataToAlertParam);
            if(alert.alert === true) {                   
                getSound().getSoundAlertUpMarket();
            }

        });
        break;

    case "SEARCH":
        let current = this;
        intervalFunction(async function () {
            let statusCryptos = await traderInstance.checkOportunities(pairs);
            console.table(statusCryptos);
            
            const alert = traderInstance.alertEntryCriteria(statusCryptos);
            if(alert.alert === true) {                   
                console.log(alert.pairs);
                console.table(alert.dataAnalizedSelected);
                getSound().getSoundAlertUpMarket();
            }
        });
        break;

    default:
        console.log("No Command Found");
        break;
}


function intervalFunction (callback, minutes = 1) {
    callback();
    setInterval(function () {
        callback();
    }, minutes * 60 * 1000);
}

