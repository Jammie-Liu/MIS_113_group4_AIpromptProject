import readline from "node:readline/promises";
import { askAnswerAI } from "./answerAI.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let history = [];

console.log("輸入你的 prompt，輸入 Q 結束。");
while (true) {
  const text = await rl.question("你：");
  if (text.trim() === "Q") break;
  history = await askAnswerAI(history, text);
  console.log("AI：" + history.at(-1).content + "\n");
}
rl.close();
