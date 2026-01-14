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

// 根据设备类型调整限制
function getAccessLimit(): number {
  // 检测是否为移动设备
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // 移动设备稍微放宽限制（因为NAT和共享IP更常见）
  return isMobile ? 5 : 4;
}

const TIME_WINDOW = 60 * 60 * 1000; // 1小时，毫秒

// 生成设备指纹（作为IP获取失败时的fallback，移动端优化）
function getDeviceFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // 在移动端Canvas可能不可用，添加try-catch
    if (ctx) {
      ctx.fillText("fingerprint", 10, 10);
    }

    // 移动端特有的特征
    const mobileFeatures = [
      "ontouchstart" in window, // 触摸支持
      navigator.maxTouchPoints || 0, // 最大触摸点
      "orientation" in window, // 屏幕方向
      screen.orientation?.angle || 0, // 屏幕角度
      navigator.connection?.effectiveType || "unknown", // 网络类型（移动端常见）
    ];

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      !!window.indexedDB,
      "serviceWorker" in navigator, // Service Worker支持
      "Notification" in window, // 通知支持
      "vibrate" in navigator, // 震动支持（移动端）
      "geolocation" in navigator, // 地理位置支持
      ...mobileFeatures,
      canvas.toDataURL ? canvas.toDataURL().substring(0, 50) : "no-canvas", // 限制Canvas数据长度
    ].join("|");

    // 使用改进的hash函数
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }

    return "fp-" + Math.abs(hash).toString(36);
  } catch (error) {
    // 如果指纹生成失败，使用最简单的fallback
    console.warn("设备指纹生成失败:", error);
    return "fallback-" + Date.now().toString(36);
  }
}

// 安全的存储操作（兼容移动端浏览器）
function safeGetItem(key: string): string | null {
  try {
    // 先尝试localStorage
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("localStorage读取失败:", error);
    try {
      // fallback到sessionStorage
      return sessionStorage.getItem(key);
    } catch (sessionError) {
      console.warn("sessionStorage也读取失败:", sessionError);
      // 最后的fallback：尝试使用cookie（移动端更兼容）
      try {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const [cookieKey, cookieValue] = cookie.trim().split("=");
          if (cookieKey === key) {
            return decodeURIComponent(cookieValue);
          }
        }
      } catch (cookieError) {
        console.warn("Cookie读取也失败:", cookieError);
      }
      return null;
    }
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    // 优先使用localStorage
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("localStorage写入失败，尝试sessionStorage:", error);
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (sessionError) {
      console.warn("sessionStorage写入也失败，尝试cookie:", sessionError);
      try {
        // 使用cookie作为最后的fallback（设置7天过期）
        const expires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toUTCString();
        document.cookie = `${key}=${encodeURIComponent(
          value
        )}; expires=${expires}; path=/; SameSite=Lax`;
        return true;
      } catch (cookieError) {
        console.warn("Cookie写入也失败:", cookieError);
        return false;
      }
    }
  }
}

// 获取客户端IP（在浏览器环境中使用公共服务）
async function getClientIP(): Promise<string> {
  // 首先尝试多个IP查询服务（移动端兼容）
  const ipServices = ["https://api.ip.sb/jsonip", "https://httpbin.org/ip"];

  for (const service of ipServices) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 移动端网络可能较慢，增加超时时间

      const response = await fetch(service, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; MagicAccessory/1.0)",
          "Cache-Control": "no-cache", // 避免缓存问题
        },
        mode: "cors", // 明确指定CORS模式
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();

      // 不同的服务返回不同的格式
      const ip = data.ip || data.query || data.origin;
      if (ip && typeof ip === "string") {
        console.log(`成功获取IP (${service}):`, ip);
        return ip;
      }
    } catch (error) {
      console.warn(`${service} 获取失败:`, error);
      continue;
    }
  }

  // 如果所有服务都失败，使用设备指纹（移动端优化）
  console.warn("所有IP查询服务失败，使用设备指纹");
  return getDeviceFingerprint();
}

// 获取剩余使用次数
export async function getRemainingUses(): Promise<number> {
  try {
    const clientIP = await getClientIP();
    const storageKey = `miragehime_access_${clientIP}`;
    const now = Date.now();

    const stored = safeGetItem(storageKey);
    if (stored) {
      const record: AccessRecord = JSON.parse(stored);

      // 检查是否超过时间窗口
      if (now - record.firstAccess > TIME_WINDOW) {
        return getAccessLimit(); // 重置后可以全额使用
      }

      return Math.max(0, getAccessLimit() - record.count);
    }

    return getAccessLimit(); // 新用户可以全额使用
  } catch (error) {
    console.warn("获取剩余使用次数失败:", error);
    return getAccessLimit(); // 出错时假设可以全额使用
  }
}

// 检查并记录访问
async function recordAccess(): Promise<void> {
  try {
    const clientIP = await getClientIP();
    const storageKey = `miragehime_access_${clientIP}`;
    const now = Date.now();
    const currentLimit = getAccessLimit();

    // 获取现有记录
    const stored = safeGetItem(storageKey);
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
    if (record.count >= currentLimit) {
      const remainingTime = Math.ceil(
        (TIME_WINDOW - (now - record.firstAccess)) / (60 * 1000)
      );
      throw new Error(
        `访问过于频繁，请${remainingTime}分钟后再试。（每小时最多使用${currentLimit}次）`
      );
    }

    // 更新记录
    record.count += 1;
    record.lastAccess = now;

    // 保存记录（优先localStorage，失败时使用sessionStorage，最后使用cookie）
    const saved = safeSetItem(storageKey, JSON.stringify(record));
    if (!saved) {
      console.warn("存储访问记录失败，限制功能可能不生效");
    }

    console.log(
      `IP ${clientIP} 访问记录: ${record.count}/${currentLimit} (${
        navigator.userAgent.includes("Mobile") ? "移动端" : "桌面端"
      })`
    );
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
