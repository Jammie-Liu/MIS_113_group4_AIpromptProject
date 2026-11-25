import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";

// 執行時可以指定模型，沒指定就用 Opus 5.5
const model = process.argv[2] ?? "anthropic.claude-opus-5-5";

const client = new AnthropicBedrockMantle({ awsRegion: "us-east-1" });

const msg = await client.messages.create({
  model,
  max_tokens: 1000,
  messages: [{ role: "user", content: "用一句話介紹你自己" }],
});

console.log(model, "→", msg.content[0].text);
