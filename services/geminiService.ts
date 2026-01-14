const API_KEY = process.env.API_KEY || "";

// 验证API密钥是否正确加载
if (!API_KEY || API_KEY.trim() === "") {
  console.error("API密钥未正确配置，请检查.env文件");
} else {
  console.log("API密钥已加载，长度:", API_KEY.length);
}

// IP访问限制管理
interface AccessRecord {
  count: number;
  firstAccess: number;
  lastAccess: number;
}

const ACCESS_LIMIT = 4; // 每小时最大访问次数
const TIME_WINDOW = 60 * 60 * 1000; // 1小时，毫秒

// 获取客户端IP（在浏览器环境中使用公共服务）
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn("无法获取IP地址，使用本地标识:", error);
    // 降级方案：使用浏览器指纹
    return "local-" + Math.random().toString(36).substr(2, 9);
  }
}

// 获取剩余使用次数
export async function getRemainingUses(): Promise<number> {
  try {
    const clientIP = await getClientIP();
    const storageKey = `miragehime_access_${clientIP}`;
    const now = Date.now();

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const record: AccessRecord = JSON.parse(stored);

      // 检查是否超过时间窗口
      if (now - record.firstAccess > TIME_WINDOW) {
        return ACCESS_LIMIT; // 重置后可以全额使用
      }

      return Math.max(0, ACCESS_LIMIT - record.count);
    }

    return ACCESS_LIMIT; // 新用户可以全额使用
  } catch (error) {
    console.warn("获取剩余使用次数失败:", error);
    return ACCESS_LIMIT; // 出错时假设可以全额使用
  }
}

// 检查访问限制
// 检查并记录访问
async function recordAccess(): Promise<void> {
  try {
    const clientIP = await getClientIP();
    const storageKey = `miragehime_access_${clientIP}`;
    const now = Date.now();

    // 获取现有记录
    const stored = localStorage.getItem(storageKey);
    let record: AccessRecord;

    if (stored) {
      record = JSON.parse(stored);

      // 检查是否超过时间窗口
      if (now - record.firstAccess > TIME_WINDOW) {
        // 重置记录
        record = {
          count: 0,
          firstAccess: now,
          lastAccess: now,
        };
      }
    } else {
      // 新用户
      record = {
        count: 0,
        firstAccess: now,
        lastAccess: now,
      };
    }

    // 检查是否超过限制
    if (record.count >= ACCESS_LIMIT) {
      const remainingTime = Math.ceil(
        (TIME_WINDOW - (now - record.firstAccess)) / (60 * 1000)
      );
      throw new Error(
        `访问过于频繁，请${remainingTime}分钟后再试。（每小时最多使用${ACCESS_LIMIT}次）`
      );
    }

    // 更新记录
    record.count += 1;
    record.lastAccess = now;

    // 保存记录
    localStorage.setItem(storageKey, JSON.stringify(record));

    console.log(`IP ${clientIP} 访问记录: ${record.count}/${ACCESS_LIMIT}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
  }
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
  // 检查并记录访问
  await recordAccess();

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
