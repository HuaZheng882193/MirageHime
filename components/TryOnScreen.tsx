import React, { useState, useRef } from "react";
import { analyzeHand } from "../services/geminiService";
import { HandAnalysis } from "../types";

declare var html2pdf: any;
declare var html2canvas: any;

interface TryOnScreenProps {
  onBack: () => void;
}

const CATEGORIES = [
  {
    id: "ring",
    name: "戒指美学分析",
    icon: "💍",
    desc: "基于手型推荐最适合的指环设计",
  },
  {
    id: "bracelet",
    name: "手链美学分析",
    icon: "✨",
    desc: "通过腕部线条定制饰品风格",
  },
];

const TryOnScreen: React.FC<TryOnScreenProps> = ({ onBack }) => {
  const [step, setStep] = useState<
    "category" | "upload" | "analyzing" | "result"
  >("category");
  const [activeCategory, setActiveCategory] = useState("ring");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    setStep("upload");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setImage(base64);
        setStep("analyzing");
        try {
          const result = await analyzeHand(base64, activeCategory);
          setAnalysis(result);
          setStep("result");
        } catch (error) {
          console.error("Analysis failed", error);
          alert("分析失败，请检查网络或更换照片重试");
          setStep("upload");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPNG = async () => {
    if (!analysis || !image || !reportContentRef.current) return;
    setIsDownloading(true);

    try {
      const element = reportContentRef.current;

      // 使用html2canvas将DOM元素转换为canvas
      const canvas = await html2canvas(element, {
        scale: 2, // 提高分辨率
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      // 将canvas转换为blob
      canvas.toBlob(
        (blob: Blob) => {
          // 创建下载链接
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `幻饰姬-魔法契约报告-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        },
        "image/png",
        1.0
      );
    } catch (err) {
      console.error(err);
      alert("报告生成失败，请重试");
      setIsDownloading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case "category":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c] animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-white text-3xl font-black mb-2 tracking-tight">
                AI 美学实验室
              </h2>
              <p className="text-white/40 text-sm font-medium tracking-wide">
                请选择您想要进行分析的饰品品类
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="group relative overflow-hidden rounded-[32px] p-6 bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all active:scale-95">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl">
                      {cat.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-bold text-lg">
                        {cat.name}
                      </h4>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">
                        Professional Analysis
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "upload":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c] animate-fade-in">
            <button
              onClick={() => setStep("category")}
              className="absolute top-24 left-8 text-white/40 text-xs font-bold flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回
            </button>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/5] rounded-[48px] border-2 border-dashed border-pink-500/30 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden active:bg-white/10 transition-colors">
              <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                上传{activeCategory === "ring" ? "手部" : "手腕"}照片
              </h3>
              <p className="text-white/40 text-sm mb-8 text-center px-12">
                AI 将分析您的骨骼线条与肤色基因
              </p>
              <div className="px-10 py-4 magic-gradient rounded-3xl text-white font-black shadow-lg shadow-pink-500/20">
                开始 AI 诊断
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        );

      case "analyzing":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c]">
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                🔮
              </div>
            </div>
            <h3 className="text-white text-xl font-black mb-4 tracking-widest animate-pulse">
              正在解码美学基因...
            </h3>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        );

      case "result":
        return (
          <div className="flex-1 flex flex-col bg-[#FFF5F7] overflow-y-auto hide-scrollbar">
            {/* 魔法报告主容器 */}
            <div ref={reportContentRef} className="bg-[#FFF5F7] pb-12">
              {/* 顶部英雄区：带装饰的拍立得效果 */}
              <div className="relative pt-12 px-6 pb-4">
                <div className="relative aspect-[4/5] w-full rounded-[40px] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-pink-100">
                  <img
                    src={image!}
                    className="w-full h-full object-cover"
                    alt="Uploaded"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent"></div>

                  {/* 悬浮装饰 */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                    <span className="text-pink-500 animate-pulse">✨</span>
                    <span className="text-[10px] font-black text-gray-800 tracking-tighter">
                      AI GENETIC SCAN
                    </span>
                  </div>

                  {/* 魔法印章 */}
                  <div className="absolute bottom-6 left-6 w-20 h-20 border-2 border-white/50 rounded-full flex items-center justify-center rotate-12">
                    <div className="text-[8px] text-white font-bold text-center leading-tight">
                      CERTIFIED
                      <br />
                      AESTHETIC
                      <br />
                      GENIUS
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 -mt-8 relative z-10 pb-4">
                {/* 结果主卡片 */}
                <div className="bg-white rounded-[48px] shadow-[0_30px_60px_-15px_rgba(255,102,153,0.15)] p-8 border-b-8 border-pink-100">
                  {/* 标题区 */}
                  <div className="text-center mb-10">
                    <div className="inline-block px-4 py-1 bg-pink-50 rounded-full text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] mb-3">
                      Your Magic Signature
                    </div>
                    <h2 className="text-gray-900 text-4xl font-black mb-2 flex items-center justify-center gap-3">
                      <span className="text-2xl">✦</span>
                      {analysis?.shape}
                      <span className="text-2xl">✦</span>
                    </h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-transparent via-pink-200 to-transparent mx-auto"></div>
                  </div>

                  <div className="space-y-10">
                    {/* 形态特征 */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-[10px]">
                          🌸
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          魔法特质描述
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis?.features
                          ?.filter(
                            (feature) => feature && feature.trim().length > 0
                          )
                          ?.map((feature, i) => (
                            <div
                              key={i}
                              className="px-5 py-2.5 bg-[#FFF9FA] rounded-2xl text-gray-700 text-sm font-bold border border-pink-50 shadow-sm transition-transform hover:scale-105">
                              {feature.trim()}
                            </div>
                          )) || (
                          <div className="px-5 py-2.5 bg-[#FFF9FA] rounded-2xl text-gray-500 text-sm font-bold border border-pink-50 shadow-sm">
                            暂无特征描述
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 专家建议：信件风格 */}
                    <section className="relative">
                      <div className="absolute -top-4 -right-2 text-6xl text-pink-50 opacity-50 select-none">
                        “
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-[10px]">
                          🔮
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          专属美学建议
                        </h4>
                      </div>
                      <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/30 rounded-[32px] p-7 border border-pink-100/50">
                        <p className="text-gray-800 text-[15px] leading-loose font-medium italic">
                          {analysis?.recommendations}
                        </p>
                      </div>
                    </section>

                    {/* 推荐类型：网格卡片 */}
                    <section>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-[10px]">
                            ⭐
                          </div>
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            推荐款式风格
                          </h4>
                        </div>
                        <span className="text-[9px] bg-pink-500 text-white px-3 py-1 rounded-full font-black animate-bounce shadow-lg shadow-pink-200">
                          99% MATCH
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {analysis?.recommendedTypes.map((type, i) => (
                          <div
                            key={i}
                            className="group relative bg-[#FFF9FA] p-4 rounded-[28px] border border-pink-50 flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-xl active:scale-95">
                            <div className="w-12 h-12 rounded-full bg-white shadow-inner flex items-center justify-center text-xl mb-3 border border-pink-50">
                              {activeCategory === "ring" ? "💍" : "✨"}
                            </div>
                            <span className="text-gray-900 font-black text-[10px] leading-tight px-1">
                              {type}
                            </span>
                            <div className="mt-2 flex gap-0.5">
                              {[1, 2, 3].map((s) => (
                                <span
                                  key={s}
                                  className="text-[8px] text-pink-300">
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                {/* 页脚版权 */}
                <div className="pt-12 text-center opacity-30">
                  <p className="text-[8px] font-black tracking-[0.4em] text-gray-400 uppercase">
                    Magic Accessory AI Lab • 2024
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮区 (始终保持底部) */}
            <div className="px-6 pb-12 pt-4 bg-[#FFF5F7]">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onBack}
                  className="py-5 bg-white rounded-[28px] text-gray-400 font-black text-sm border-2 border-pink-50 shadow-sm active:scale-95 transition-all">
                  暂存记忆
                </button>
                <button
                  onClick={handleDownloadPNG}
                  disabled={isDownloading}
                  className="py-5 magic-gradient rounded-[28px] text-white font-black text-sm shadow-xl shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDownloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      导出图片
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={() => setStep("category")}
                className="w-full mt-6 py-2 text-pink-400 font-black text-[10px] tracking-widest flex items-center justify-center gap-2 hover:text-pink-600 transition-colors">
                <span>RE-DIAGNOSIS</span>
                <span className="w-1 h-1 bg-pink-200 rounded-full"></span>
                <span>重新诊断</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[60] flex flex-col font-sans overflow-hidden">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-xl flex items-center justify-center pointer-events-auto active:scale-90 transition-all ${
            step === "result"
              ? "bg-white/90 text-gray-700 hover:bg-white shadow-lg"
              : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20"
          }`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <span
            className={`text-[9px] uppercase tracking-[0.2em] font-bold block mb-1 transition-colors ${
              step === "result"
                ? "text-pink-500 drop-shadow-sm"
                : "text-white/40"
            }`}>
            Mirror Lab
          </span>
          <h2
            className={`font-black tracking-tight transition-all ${
              step === "result"
                ? "text-gray-900 text-xl drop-shadow-sm"
                : "text-white text-lg"
            }`}>
            AI 美学实验室
          </h2>
        </div>
        <div className="w-10 h-10"></div>
      </div>
      {renderContent()}
    </div>
  );
};

export default TryOnScreen;
