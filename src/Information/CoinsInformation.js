import axios from 'axios';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const configuration = require('../../config.json');

export function getCoinsInformation() {
    return CoinsInformation.getInstance();
}

class CoinsInformation {
    url = configuration.information.urlbaseapi;    

    static #instance;

    static getInstance() {
        if (!CoinsInformation.#instance) {
            CoinsInformation.#instance = new CoinsInformation()
        }
        return CoinsInformation.#instance
    }

    /**
     * 
     * @param {string} parCoin 
     * @param {string} path 
     * @param {string} interval 
     * @returns {string}
     */
    #getUrl(parCoin, path, time) {
        return this.url + path + '?symbol=' + parCoin + '&interval=' + time + '&limit=1000';
    }

    /**
     * 
     * @param {string} parCoin 
     * @param {string} time 
     * @returns 
     */
    async getHistoricalData(parCoin, time) {
        const current = this;
        const url = this.#getUrl(parCoin, "klines", time);
        return axios.get(url).then(function (response) {
            const data = current.#convertData(response.data);
            return data;
        }).catch(function (error) {
            console.log(error);
        });
    }

    /**
     * 
     * @param {Array} dataArray 
     */
    #convertData(dataArray) {
        let dataArrayConvert = [];
        let pos = 0;
        dataArray.map(function (element) {
            var date = new Date(element[6]);
            var formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);

            let provisionalObject = {
                high: parseFloat(element[2]),
                low: parseFloat(element[3]),
                "diff%": parseFloat((element[2]) - parseFloat(element[3])) / parseFloat(element[3]) * 100,
                close: parseFloat(element[4]),
                volume: parseFloat(element[5]),
                numtrades: parseFloat(element[8]),
                open: parseFloat(element[1]),
                dataClose: formattedDate,
                pos: pos

            };
            pos++;
            provisionalObject["bullish"] = provisionalObject.open < provisionalObject.close;

            if(provisionalObject["bullish"] === true) {
                provisionalObject["lowerShadow"] = provisionalObject.open - provisionalObject.low;
                provisionalObject["higherShadow"] = provisionalObject.high - provisionalObject.close;
                provisionalObject["body"] = provisionalObject.close - provisionalObject.open;
                provisionalObject["total"] = provisionalObject.high - provisionalObject.low;
            } else {
                provisionalObject["lowerShadow"] = provisionalObject.close - provisionalObject.low;
                provisionalObject["higherShadow"] = provisionalObject.high - provisionalObject.open;
                provisionalObject["body"] = provisionalObject.open - provisionalObject.close;
                provisionalObject["total"] = provisionalObject.high - provisionalObject.low;
            }
   
            dataArrayConvert.push(provisionalObject);
        });
        return dataArrayConvert;
    }

    async getCurrentPrice(asset) {
        const parCoin = asset + "BUSD";
        const historicalData = await this.getHistoricalData(parCoin, "1m");
        return historicalData[historicalData.length - 1].close;
    }

    async getTotalValueAsset(asset, qty) {
        const price = await this.getCurrentPrice(asset);
        return price * qty;
    }

    async getFilters(pair) {
        const url = "https://www.binance.com/api/v1/exchangeInfo";
        return axios.get(url).then(function (response) {
            const datos = response.data.symbols;
            const result = datos.filter(datos => datos.symbol == pair);
            return result[0].filters;
        }).catch(function (error) {
            console.log(error);
        });
    }

    async getAllAssetsByQuoteAsset(quoteAsset, lim = 20) {
        const url = "https://www.binance.com/api/v1/exchangeInfo";
        let symbols = [];
        return axios.get(url).then(function (response) {
            const datos = response.data.symbols;
            const result = datos.filter(datos => datos.quoteAsset == quoteAsset && datos.status === 'TRADING');
            if(result.length < lim) {
                lim = result.length;
            }
            
            for (let index = 0; index < lim; index++) {             
                symbols.push(result[index].symbol);                
            }
            
            return symbols;
        }).catch(function (error) {
            console.log(error);
        });
    }

    async getBookOrder(pair, limit = 50) {
        const url = "https://api.binance.com/api/v3/depth?limit=" + limit + "&symbol=" + pair;
        return axios.get(url).then(function (response) {
            return response.data;
        }).catch(function (error) {
            console.log(error);
            return false;
        });
    }

    async getTruncates(pair) {
        let truncate = {};
        await this.getFilters(pair).then(function (res) {            
    
            for (let index = 0; index < res.length; index++) {
                const element = res[index];
                if(element.filterType == 'PRICE_FILTER') {
                    let tickSize = element.tickSize;
                    let decimals = tickSize.split(".");
                    let position = 0;
                    for (let j = 0; j < decimals[1].length; j++) {
                        if(decimals[1][j] == '1') {
                            position = j + 1;
                            break;
                        }                    
                    }
                    truncate["price"] = position;
                }
    
                if(element.filterType == 'LOT_SIZE') {
                    let tickSize = element.stepSize;
                    let decimals = tickSize.split(".");
                    let position = 0;
                    for (let j = 0; j < decimals[1].length; j++) {
                        if(decimals[1][j] == '1') {
                            position = j + 1;
                            break;
                        }                    
                    }
                    truncate["qty"] = position;
                }
                
            }
    
        });
        return truncate;
    }

}
