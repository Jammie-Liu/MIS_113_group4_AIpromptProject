// AI 呼叫的唯一入口：用 AI_MODE 切換
//   mock   → 假資料（預設，不花錢）
//   nova   → Amazon Nova（AWS 自家模型，免費方案可用額度）
//   bedrock→ Claude（帳號升級後）
const MODE = process.env.AI_MODE ?? "mock";

export async function callAI({ system, messages, model = "anthropic.claude-opus-5-5", maxTokens = 2000, mock }) {
  if (MODE === "mock") return typeof mock === "function" ? mock({ system, messages }) : (mock ?? "（假回覆）這是 AI 的回答。");

  const region = process.env.BEDROCK_REGION ?? "us-east-1";

  if (MODE === "nova") {
    const { BedrockRuntimeClient, ConverseCommand } = await import("@aws-sdk/client-bedrock-runtime");
    const client = new BedrockRuntimeClient({ region });
    const res = await client.send(new ConverseCommand({
      modelId: process.env.NOVA_MODEL ?? "us.amazon.nova-lite-v1:0",
      // Converse API 的格式：system 和每則訊息都要包成 [{ text }]
      system: system ? [{ text: system }] : undefined,
      messages: messages.map((m) => ({ role: m.role, content: [{ text: m.content }] })),
      inferenceConfig: { maxTokens, temperature: 0 },
    }));
    return res.output?.message?.content?.find((b) => b.text)?.text ?? "";
  }

  if (MODE === "bedrock") {
    const { AnthropicBedrockMantle } = await import("@anthropic-ai/bedrock-sdk");
    const client = new AnthropicBedrockMantle({ awsRegion: region });
    const msg = await client.messages.create({ model, max_tokens: maxTokens, system, messages });
    return msg.content.find((b) => b.type === "text")?.text ?? "";
  }

  throw new Error(`看不懂的 AI_MODE：${MODE}（可以用 mock、nova、bedrock）`);
}