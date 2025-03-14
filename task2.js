import fs from "fs";
import path from "path";
import crypto from "crypto";

const folder_path = "F:\\Itransition Internship\\task 1\\task2";
const email = "paul.sowrin2002@gmail.com".toLowerCase();

const sha3_256 = (data) => crypto.createHash("sha3-256").update(data).digest("hex");

let hashes = fs.readdirSync(folder_path).map(file => sha3_256(fs.readFileSync(path.join(folder_path, file)))).sort((a, b) => b.localeCompare(a));

let input = hashes.join("") + email;
let hashedChar = sha3_256(input);

console.log(hashedChar);