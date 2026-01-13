const API_KEY = process.env.API_KEY || "";

// 验证API密钥是否正确加载
if (!API_KEY || API_KEY.trim() === "") {
  console.error("API密钥未正确配置，请检查.env文件");
} else {
  console.log("API密钥已加载，长度:", API_KEY.length);
}

// 将characteristics字符串转换为数组
function convertCharacteristicsToArray(characteristics: string): string[] {
  if (!characteristics || typeof characteristics !== "string") {
    return [];
  }

  // 按句号分割，然后过滤掉空字符串和过短的句子
  const sentences = characteristics
    .split(/[。！？]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5) // 过滤掉过短的句子
    .slice(0, 6); // 最多取6个特征

  // 如果分割后没有足够的句子，尝试按逗号分割
  if (sentences.length < 2) {
    const commaSplit = characteristics
      .split(/[，,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3)
      .slice(0, 6);

    if (commaSplit.length > sentences.length) {
      return commaSplit;
    }
  }

  return sentences.length > 0 ? sentences : [characteristics];
}

export const analyzeHand = async (base64Image: string, category: string) => {
  const categoryName = category === "ring" ? "戒指" : "手链";

  // 确保base64图片格式正确
  let processedImage = base64Image;
  if (base64Image.startsWith("data:image/")) {
    processedImage = base64Image;
  }

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Qwen/Qwen3-VL-32B-Instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请分析这张手部照片。首先识别手型（如：尖锥型、长方型、椭圆型等），详细描述其特点，并专门针对"${categoryName}"品类给出专业美学建议。此外，请列出4种最适合该手型的${categoryName}具体款式类型（例如：细带简约型、夸张宝石型、编织波西米亚型等）。请以JSON格式返回，格式如下：{"hand_type": "手型名称", "hand_characteristics": "手型特点描述", "aesthetic_advice_for_bracelets": "美学建议", "recommended_bracelet_styles": ["款式1", "款式2", "款式3", "款式4"]}，不要包含Markdown代码块。`,
            },
            {
              type: "image_url",
              image_url: {
                url: processedImage,
              },
            },
          ],
        },
      ],
      stream: false,
      max_tokens: 4096,
      temperature: 0,
      top_p: 0.8,
      frequency_penalty: 0.1,
      response_format: { type: "json_object" },
    }),
  };

  try {
    console.log("发送API请求到 SiliconFlow...");
    const response = await fetch(
      "https://api.siliconflow.cn/v1/chat/completions",
      options
    );
    const result = await response.json();

    console.log("API响应状态:", response.status);
    console.log("API响应内容:", result);

    if (!response.ok) {
      const errorMessage =
        result.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`SiliconFlow API请求失败: ${errorMessage}`);
    }

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error("API响应格式错误: 缺少 choices 或 message 字段");
    }

    const content = result.choices[0].message.content;
    if (!content) {
      throw new Error("API返回内容为空");
    }

    console.log("API返回的原始内容:", content);
    const rawData = JSON.parse(content);

    // 将API返回的数据转换为期望的格式
    const data = {
      shape: rawData.hand_type || "未知手型",
      features: convertCharacteristicsToArray(rawData.hand_characteristics),
      recommendations: rawData.aesthetic_advice_for_bracelets || "暂无建议",
      recommendedTypes: rawData.recommended_bracelet_styles || [],
    };

    // 验证转换后的数据结构
    if (
      !data.shape ||
      !Array.isArray(data.features) ||
      !data.recommendations ||
      !Array.isArray(data.recommendedTypes)
    ) {
      throw new Error("API返回的数据结构不符合预期");
    }

    return data;
  } catch (error) {
    // 如果是网络错误或其他非API错误，保留原错误
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("网络连接失败，请检查网络连接");
    }
    throw error;
  }
};
