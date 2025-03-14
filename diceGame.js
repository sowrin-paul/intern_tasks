import * as crypto from "crypto";
import readline from "readline";

class KeyGenerator{
    static generateKey(){
        return crypto.randomBytes(32).toString("hex");
    }
}

class HMAClac{
    static calculateHma(key, message){
        return crypto.createHmac("sha3-256", key).update(message).digest("hex");
    }
}

class Dice{
    constructor(faces){
        this.faces = faces;
    }

    roll(){
        const index = crypto.randomInt(0, this.faces.length);
        return this.faces[index];
    }
}

class DiceParser {
    static parse(args) {
        return args.map(arg => {
            const faces = arg.split(",").map(Number);
            if (faces.length !== 6 || faces.some(isNaN)) {
                throw new Error("Invalid dice format. Provide comma separated integers.");
            }
            return new Dice(faces);
        });
    }
}

class ProbabilituCalc{
    static calculateProbability(diceSet){
        const result = Array(diceSet.length).fill(0).map(() => Array(diceSet.length).fill(0));
        const trail = 10000;

        for(let i = 0; i < diceSet.length; i++){
            for (let j = 0; j < diceSet.length; j++) {
                if(i != j){
                    let wins = 0;
                    for (let k = 0; k < trail; k++) {
                        const roll1 = diceSet[i].roll();
                        const roll2 = diceSet[j].roll();
                        if(roll1 > roll2) wins++;
                    }
                    result[i][j] = (wins / trail * 100).toFixed(2) + "%";
                }else{
                    result[i][j] = "N/A";
                }
            }
        }
        return result;
    }

    static showProbabilities(probabilities){
        console.log("Probabilitu Table:");
        probabilities.forEach((row, i) => {
            console.log(`Dice${i + 1}: ${row.join(" | ")}`);
        });
    }
}

class FairRandomGenerator{
    static async getNumber(range){
        const r1 = readline.createInterface({ input: process.stdin, output: process.stdout});
        return new Promise(resolve => {
            r1.question(`Enter a number between 0 and ${range - 1}, X (exit), or ? (help): `, answer => {
                if(answer === 'X') process.exit(1);
                if(answer === '?') {
                    console.log('Help: You can enter a number within the range, X to exit, or ? to display this message.');
                    resolve(this.getNumber(range));
                }
                const userNumber = parseInt(answer);
                if(isNaN(userNumber) || userNumber < 0 || userNumber >= range){
                    console.log(`Invalid input.`);
                    process.exit(1);
                }
                r1.close();
                resolve(userNumber);
            });
        });
    }

    static async generateNumber(range){
        const key = KeyGenerator.generateKey();
        const computerNumber = crypto.randomInt(0, range);
        const hmac = HMAClac.calculateHma(key, computerNumber.toString());

        console.log(`Comitment (HMAC): ${hmac}`);

        const userNumber = await this.getNumber(range);
        const finalNumber = (userNumber + computerNumber) % range;

        console.log(`computer's number: ${computerNumber}`);
        console.log(`key for verify: ${key}`);

        return finalNumber;
    }
}

class Game{
    constructor(diceSet){
        this.diceSet = diceSet;
    }

    async play(){
        console.log("start the game...");
        const range = this.diceSet.length;
        const diceIndex = await FairRandomGenerator.generateNumber(range);

        console.log(`you will use dice ${diceIndex + 1}`);

        const roll = this.diceSet.map(dice => dice.roll());
        const winner = roll.indexOf(Math.max(...roll));

        console.log(`Rolls: ${roll.join(", ")}`);
        console.log(`winner: dice ${winner + 1}`);
    }
}

const main = async () => {
    try{
        const args = process.argv.slice(2);
        if(args.length < 2){
            console.log("Provide at least two dice as arguments.");
            return;
        }

        const diceSet = DiceParser.parse(args);
        const probabilities = ProbabilituCalc.calculateProbability(diceSet);
        ProbabilituCalc.showProbabilities(probabilities);

        const game = new Game(diceSet);
        await game.play();
    }
    catch(e){
        console.log(`Error: ${e.message}`);
    }
};

main();