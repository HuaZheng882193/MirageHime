import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

// 验证API密钥是否正确加载
if (!API_KEY || API_KEY.trim() === "") {
  console.error("API密钥未正确配置，请检查.env文件");
}

export const analyzeHand = async (base64Image: string, category: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const categoryName = category === "ring" ? "戒指" : "手链";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          {
            text: `请分析这张手部照片。首先识别手型（如：尖锥型、长方型、椭圆型等），详细描述其特点，并专门针对"${categoryName}"品类给出专业美学建议。此外，请列出4种最适合该手型的${categoryName}具体款式类型（例如：细带简约型、夸张宝石型、编织波西米亚型等）。请以JSON格式返回，不要包含Markdown代码块。`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shape: { type: Type.STRING, description: "手型名称" },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "手型特点描述",
          },
          recommendations: {
            type: Type.STRING,
            description: "专业美学建议文本",
          },
          recommendedTypes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 4,
            maxItems: 4,
            description: "推荐的4种首饰款式类型名称",
          },
        },
        required: ["shape", "features", "recommendations", "recommendedTypes"],
      },
    },
  });

  const rawText = response.text;
  const data = JSON.parse(rawText || "{}");
  return data;
};
