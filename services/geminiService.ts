
import { GoogleGenAI } from "@google/genai";

// Hardcoding for testing to ensure it works in browser
const API_KEY = "AIzaSyBTRmInhNKbAelMC3PEk6W59jPLdbIaFcA";

export const analyzeHand = async (base64Image: string, category: string) => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  // Use the object form which is required in some browser-based SDK versions
  const genAI = new GoogleGenAI(API_KEY);
  
  // Actually, the error "An API Key must be set when running in a browser" 
  // often happens when the SDK thinks it's in a browser but the key is passed as a string 
  // and it expects it to be handled via a specific proxy or it's just a bug in how it detects the key.
  // Passing it as an object { apiKey: ... } often bypasses this check.
  
  const genAIInstance = new (GoogleGenAI as any)({ apiKey: API_KEY });
  
  const model = genAIInstance.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  
  const categoryName = category === 'ring' ? '戒指' : '手链';
  const prompt = `请分析这张手部照片。首先识别手型（如：尖锥型、长方型、椭圆型等），详细描述其特点，并专门针对"${categoryName}"品类给出专业美学建议。此外，请列出4种最适合该手型的${categoryName}具体款式类型（例如：细带简约型、夸张宝石型、编织波西米亚型等）。请以JSON格式返回。`;

  const imageData = base64Image.split(',')[1] || base64Image;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData
        }
      }
    ]);

    const response = await result.response;
    const rawText = response.text();
    console.log("AI Response:", rawText);
    
    // Clean up the response text if it contains markdown code blocks
    const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanText || '{}');
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
