import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import {playAudioFile} from 'audic';

const configuration = require('../../config.json');

export function getSound() {
    return Sound.getInstance();
}

class Sound {
    static #instance;

    static getInstance() {
        if (!Sound.#instance) {
            Sound.#instance = new Sound()
        }
        return Sound.#instance;
    }
    async getSoundAlertDownMarket() {
        
        await playAudioFile('./files/success-fanfare-trumpets-6185.mp3');
    }
    async getSoundAlertUpMarket() {
        await playAudioFile('./files/success-fanfare-trumpets-6185.mp3');
    }
}
