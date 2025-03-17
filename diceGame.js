import * as crypto from "crypto";
import readline from "readline";
import { table } from "table";

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
                    result[i][j] = (wins / trail ).toFixed(2);
                }
            }
        }
        return result;
    }

    static showProbabilityTable(probabilities, diceSet){
        const column = ["User dice v", ...diceSet.map((_, i) => `Dice ${i + 1}`)];
        const data = probabilities.map((row, i) => [`Dice ${i + 1}`, ...row]);
        const output = table([column, ...data]);

        console.log("Probability of the win for the user: ");
        console.log(output);
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

class Game {
    static async play(args) {
        const diceSet = DiceParser.parse(args);

        console.log('Let\'s determine who makes the first move.');
        const firstMove = await FairRandomGenerator.generateNumber(2);

        if (firstMove === 0) {
            console.log('You make the first move.');
        } else {
            console.log('Computer makes the first move.');
        }

        console.log('Choose your dice:');
        diceSet.forEach((dice, index) => {
            console.log(`${index} - ${dice.faces.join(",")}`);
        });

        const userDiceIndex = await FairRandomGenerator.getNumber(diceSet.length);
        console.log(`You chose Dice ${userDiceIndex + 1}.`);

        const userThrow = await FairRandomGenerator.generateNumber(6);
        const computerThrow = await FairRandomGenerator.generateNumber(6);

        const userResult = diceSet[userDiceIndex].roll();
        const computerResult = diceSet[(userDiceIndex + 1) % diceSet.length].roll();

        console.log(`Your roll result: ${userResult}`);
        console.log(`Computer's roll result: ${computerResult}`);

        if (userResult > computerResult) {
            console.log('You win!');
        } else if (userResult < computerResult) {
            console.log('Computer wins!');
        } else {
            console.log('It\'s a draw!');
        }

        const probabilities = ProbabilituCalc.calculateProbability(diceSet);
        ProbabilituCalc.showProbabilityTable(probabilities, diceSet);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Provide at least two dice as arguments.');
} else {
    Game.play(args);
}