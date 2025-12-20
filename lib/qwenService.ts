const QWEN_API_KEY = process.env.NEXT_PUBLIC_QWEN_API_KEY;
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface ParsedTrigger {
  conditions: Array<{
    asset: 'BTC' | 'ETH' | 'ZETA';
    operator: 'lt' | 'gt' | 'eq';
    value: number;
    chain?: string;
  }>;
  logic: 'AND' | 'OR';
  executionPlan: {
    btc: string;
    eth: string;
    zeta: string;
  };
}

export async function parseEvacuationTrigger(userInput: string): Promise<ParsedTrigger> {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY is not configured');
  }

  const systemPrompt = `You are a cryptocurrency emergency evacuation strategy parser. Users will describe their evacuation trigger conditions in natural language.

Your task is to parse the input and return ONLY a valid JSON object with this exact structure:

{
  "conditions": [
    {"asset": "ETH", "operator": "lt", "value": 2000},
    {"asset": "BTC", "operator": "lt", "value": 40000}
  ],
  "logic": "OR",
  "executionPlan": {
    "btc": "Transfer BTC directly to safe address",
    "eth": "Swap ETH to USDC and bridge to ZetaChain",
    "zeta": "Keep on ZetaChain or transfer to safe address"
  }
}

Rules:
- asset must be one of: "BTC", "ETH", "ZETA"
- operator must be one of: "lt" (less than), "gt" (greater than), "eq" (equals)
- logic must be either "AND" or "OR"
- executionPlan must describe what to do with each asset (btc, eth, zeta)
- If user mentions multiple conditions, use "OR" logic unless they explicitly say "AND"
- Return ONLY the JSON object, no additional text or explanation
- Default execution plans:
  - BTC: Transfer to safe address
  - ETH: Swap to USDC and bridge to ZetaChain
  - ZETA: Keep on ZetaChain or transfer to safe address`;

  try {
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `User input: "${userInput}"\n\nPlease return the JSON object:`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Qwen API response');
    }

    // Extract JSON from response (in case there's extra text)
    let jsonStr = content.trim();
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const parsed: ParsedTrigger = JSON.parse(jsonStr);

    // Validate the parsed result
    if (!parsed.conditions || !Array.isArray(parsed.conditions)) {
      throw new Error('Invalid response: missing conditions array');
    }

    if (!parsed.logic || !['AND', 'OR'].includes(parsed.logic)) {
      throw new Error('Invalid response: logic must be AND or OR');
    }

    if (!parsed.executionPlan || !parsed.executionPlan.btc || !parsed.executionPlan.eth || !parsed.executionPlan.zeta) {
      throw new Error('Invalid response: missing executionPlan');
    }

    // Validate each condition
    for (const condition of parsed.conditions) {
      if (!['BTC', 'ETH', 'ZETA'].includes(condition.asset)) {
        throw new Error(`Invalid asset: ${condition.asset}`);
      }
      if (!['lt', 'gt', 'eq'].includes(condition.operator)) {
        throw new Error(`Invalid operator: ${condition.operator}`);
      }
      if (typeof condition.value !== 'number') {
        throw new Error(`Invalid value: ${condition.value}`);
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing evacuation trigger:', error);
    throw error;
  }
}
