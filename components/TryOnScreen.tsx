import React, { useState, useRef } from "react";
import { analyzeHand, getRemainingUses } from "../services/geminiService";
import { HandAnalysis } from "../types";
import { ACCESSORIES } from "../constants";

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

  // 小游戏状态
  const [collectedGems, setCollectedGems] = useState(0);
  const [gemPositions, setGemPositions] = useState<
    { id: number; x: number; y: number; emoji: string; collected: boolean }[]
  >([]);
  const [showParticles, setShowParticles] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);

  // 使用限制状态
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  // 根据美学建议随机选择推荐款式
  const recommendedAccessories = React.useMemo(() => {
    if (!analysis) return [];
    // 优先选择与当前品类一致的饰品
    const sameCategory = ACCESSORIES.filter(a => a.category === activeCategory);
    // 混合其他品类的饰品作为次选
    const otherCategories = ACCESSORIES.filter(a => a.category !== activeCategory);

    // 随机打乱并平铺
    const pool = [...sameCategory].sort(() => Math.random() - 0.5);
    const fallback = [...otherCategories].sort(() => Math.random() - 0.5);

    // 组合，同类在前
    const all = [...pool, ...fallback];
    return all.slice(0, 3);
  }, [analysis, activeCategory]);

  // 小游戏函数
  const initializeGems = () => {
    const gems = [];
    const emojis = ["💎", "💍", "🌟", "✨", "🎀", "🌸", "❤️", "🔮"];
    for (let i = 0; i < 8; i++) {
      gems.push({
        id: i,
        x: Math.random() * 80 + 10, // 10% - 90% 范围
        y: Math.random() * 60 + 20, // 20% - 80% 范围
        emoji: emojis[i % emojis.length],
        collected: false,
      });
    }
    setGemPositions(gems);
    setCollectedGems(0);
  };

  const handleGemClick = (gemId: number, x: number, y: number) => {
    setGemPositions((prev) =>
      prev.map((gem) => (gem.id === gemId ? { ...gem, collected: true } : gem))
    );
    setCollectedGems((prev) => prev + 1);

    // 显示粒子效果
    setShowParticles({ x, y, id: Date.now() });
    setTimeout(() => setShowParticles(null), 500);
  };

  // 初始化剩余使用次数
  React.useEffect(() => {
    const loadRemainingUses = async () => {
      const uses = await getRemainingUses();
      setRemainingUses(uses);
    };
    loadRemainingUses();
  }, []);

  // 当进入analyzing状态时初始化游戏
  React.useEffect(() => {
    if (step === "analyzing") {
      initializeGems();
    }
  }, [step]);

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

        // 先检查剩余使用次数
        const remaining = await getRemainingUses();
        if (remaining <= 0) {
          // 显示温馨的限制提示
          setShowLimitModal(true);
          return;
        }

        setStep("analyzing");
        try {
          const result = await analyzeHand(base64, activeCategory);
          setAnalysis(result);
          // 更新剩余使用次数
          const newRemaining = await getRemainingUses();
          setRemainingUses(newRemaining);
          setStep("result");
        } catch (error) {
          console.error("Analysis failed", error);

          // 更友好的错误提示
          let errorMessage = "分析失败，请重试";
          if (error instanceof Error) {
            if (error.message.includes("过于频繁")) {
              errorMessage = error.message;
            } else if (error.message.includes("网络连接")) {
              errorMessage = "网络连接失败，请检查网络连接后重试";
            } else if (error.message.includes("API密钥")) {
              errorMessage = "服务配置错误，请联系管理员";
            } else if (error.message.includes("数据结构")) {
              errorMessage = "AI分析结果异常，请更换照片重试";
            }
          }

          alert(errorMessage);
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c] relative overflow-hidden">
            {/* 小游戏分数显示 */}
            <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 z-10">
              <span className="text-yellow-400 text-lg">💎</span>
              <span className="text-white font-bold">{collectedGems}/8</span>
            </div>

            {/* 可点击的魔法宝石 */}
            {gemPositions.map(
              (gem) =>
                !gem.collected && (
                  <button
                    key={gem.id}
                    className="absolute w-12 h-12 text-2xl animate-bounce hover:scale-110 transition-transform cursor-pointer z-10"
                    style={{
                      left: `${gem.x}%`,
                      top: `${gem.y}%`,
                      animationDelay: `${gem.id * 0.2}s`,
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleGemClick(
                        gem.id,
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                      );
                    }}>
                    {gem.emoji}
                  </button>
                )
            )}

            {/* 点击粒子效果 */}
            {showParticles && (
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  left: showParticles.x - 25,
                  top: showParticles.y - 25,
                }}>
                <div className="relative w-12 h-12">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) rotate(${i * 60
                          }deg) translateY(-20px)`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center text-yellow-400 font-bold text-lg animate-bounce">
                    +1
                  </div>
                </div>
              </div>
            )}

            {/* 魔法背景粒子效果 */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-pink-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* 主要魔法圆圈 */}
            <div className="relative mb-12">
              {/* 外圈魔法符文 */}
              <div className="w-40 h-40 border-4 border-purple-400/30 rounded-full animate-spin relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              </div>

              {/* 中圈旋转元素 */}
              <div
                className="absolute inset-4 border-3 border-pink-500/50 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "3s",
                }}>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-pink-500 rounded-full animate-pulse shadow-lg shadow-pink-500/50">
                  <div className="w-full h-full bg-gradient-to-br from-pink-300 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✨
                  </div>
                </div>
              </div>

              {/* 内圈水晶球 */}
              <div className="absolute inset-8 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-blue-500 rounded-full animate-pulse shadow-xl shadow-purple-400/30">
                  <div className="w-full h-full rounded-full bg-gradient-to-t from-transparent to-white/30 animate-spin flex items-center justify-center text-white text-lg">
                    🔮
                  </div>
                </div>
              </div>
            </div>

            {/* 动态文本 */}
            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-black mb-2 tracking-wide animate-pulse">
                魔法分析中...
              </h3>
              {remainingUses !== null && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                    <span className="text-yellow-400">⚡</span>
                    <span className="text-white text-sm font-medium">
                      今日剩余: {remainingUses} 次
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-pink-300 text-sm font-medium">
                <span className="animate-bounce">✨</span>
                <span className="animate-pulse delay-100">扫描手型特征</span>
                <span className="animate-bounce delay-200">✨</span>
              </div>
            </div>

            {/* 卡通风格进度条 */}
            <div className="w-64 h-4 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"
                style={{ width: "70%" }}></div>
            </div>

            {/* 卡通魔法元素 */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce flex items-center justify-center text-sm shadow-lg">
                🌟
              </div>
              <div
                className="w-8 h-8 bg-blue-400 rounded-full animate-bounce flex items-center justify-center text-sm shadow-lg"
                style={{ animationDelay: "0.2s" }}>
                💎
              </div>
              <div
                className="w-8 h-8 bg-green-400 rounded-full animate-bounce flex items-center justify-center text-sm shadow-lg"
                style={{ animationDelay: "0.4s" }}>
                🌸
              </div>
              <div
                className="w-8 h-8 bg-purple-400 rounded-full animate-bounce flex items-center justify-center text-sm shadow-lg"
                style={{ animationDelay: "0.6s" }}>
                🎀
              </div>
              <div
                className="w-8 h-8 bg-pink-400 rounded-full animate-bounce flex items-center justify-center text-sm shadow-lg"
                style={{ animationDelay: "0.8s" }}>
                ❤️
              </div>
            </div>

            {/* 趣味提示 */}
            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">
                AI魔法师正在施展魔法...
              </p>
              <p className="text-white/40 text-xs mb-3">
                💡 点击屏幕上的魔法宝石来收集它们吧！
              </p>
              <div className="flex justify-center gap-1">
                <span className="text-xs text-pink-300 animate-pulse">
                  施法中
                </span>
                <span className="text-xs text-purple-300 animate-pulse delay-100">
                  分析中
                </span>
                <span className="text-xs text-blue-300 animate-pulse delay-200">
                  生成中
                </span>
              </div>
            </div>

            {/* 浮动装饰 */}
            <div className="absolute top-20 left-10 animate-bounce delay-300">
              <div className="w-6 h-6 bg-yellow-300 rounded-full opacity-60 animate-ping"></div>
            </div>
            <div className="absolute top-32 right-16 animate-bounce delay-500">
              <div className="w-4 h-4 bg-pink-300 rounded-full opacity-60 animate-ping"></div>
            </div>
            <div className="absolute bottom-20 left-20 animate-bounce delay-700">
              <div className="w-5 h-5 bg-blue-300 rounded-full opacity-60 animate-ping"></div>
            </div>
            <div className="absolute bottom-32 right-10 animate-bounce delay-1000">
              <div className="w-3 h-3 bg-purple-300 rounded-full opacity-60 animate-ping"></div>
            </div>
          </div>
        );

      case "result":
        return (
          <div className="flex-1 flex flex-col bg-[#FFF5F7] overflow-y-auto hide-scrollbar">
            {/* 魔法报告主容器 */}
            <div ref={reportContentRef} className="bg-[#FFF5F7] pb-12 w-full">
              {/* 顶部背景装饰 */}
              <div className="h-48 bg-pink-100/30 absolute top-0 left-0 right-0 -z-0"></div>

              {/* 标题 */}
              <div className="text-center pt-6 pb-2 relative z-10 flex items-center justify-between px-6">
                <div className="w-6"></div>
                <h1 className="text-gray-800 font-bold text-lg">AI 灵力分析报告</h1>
                <button className="text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>

              {/* 灵力识别区 */}
              <div className="relative pt-4 pb-12 flex flex-col items-center">
                <div className="relative">
                  {/* 分层圆环装饰 */}
                  <div className="w-44 h-44 rounded-full border-2 border-dashed border-pink-300 flex items-center justify-center p-2">
                    <div className="w-full h-full rounded-full border border-pink-200 p-2">
                      <div className="w-full h-full rounded-full overflow-hidden shadow-xl border-4 border-white">
                        <img
                          src={image!}
                          className="w-full h-full object-cover"
                          alt="Uploaded"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>
                  </div>
                  {/* 状态标鉴 */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-100 text-pink-500 text-[10px] px-3 py-1 rounded-full font-bold shadow-sm whitespace-nowrap">
                    灵力感应完成
                  </div>
                </div>
              </div>

              <div className="px-5 space-y-4 relative z-10">
                {/* 手型分析 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-pink-400">✨</span>
                    <h3 className="text-sm font-bold text-gray-500">手型分析</h3>
                  </div>
                  <h2 className="text-2xl font-black text-pink-500 mb-2">{analysis?.shape}</h2>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {analysis?.features.join("，")}。
                  </p>
                  <div className="flex justify-end mt-1">
                    <button className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 特质描述 */}
                {/* <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-purple-400">🪄</span>
                    <h3 className="text-sm font-bold text-gray-500">特质描述</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    “{analysis?.magicChant || "汝之指尖流转着星辰般的微光，那是来自远古森之国度的契约。这股柔和却坚韧的灵力，在晨曦与夜色交替之际最为明亮。正如那些被月光亲吻过的白银，汝的手型注定将与最纯粹的魔法回路产生共鸣。"}”
                  </p>
                </div> */}



                {/* 美学建议 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-500">💡</span>
                    <h3 className="text-sm font-bold text-gray-500">美学建议</h3>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    建议搭配<span className="text-pink-500 font-bold">冷色调金属</span>（如白金或钛银）以及具有高透明度的<span className="text-purple-500 font-bold">月长石或蓝宝石</span>，以中和这种灵动的仙气。
                    {analysis?.recommendations && <span className="block mt-2 text-gray-500 text-xs italic opacity-80 border-t border-gray-50 pt-2">{analysis.recommendations}</span>}
                  </p>
                </div>

                {/* 魔导语 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-pink-400">📖</span>
                    <h3 className="text-sm font-bold text-gray-500">魔导语</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    “{analysis?.magicChant || "汝之指尖流转着星辰般的微光，那是来自远古森之国度的契约。这股柔和却坚韧的灵力，在晨曦与夜色交替之际最为明亮。正如那些被月光亲吻过的白银，汝的手型注定将与最纯粹的魔法回路产生共鸣。"}”
                  </p>
                </div>

                {/* 推荐款式 */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-pink-400">✨</span>
                      <h3 className="text-sm font-bold text-gray-800">推荐款式</h3>
                    </div>
                    <button className="text-[10px] text-gray-400">查看更多</button>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                    {recommendedAccessories.map((item, idx) => (
                      <div key={item.id} className="min-w-[120px] flex flex-col gap-2">
                        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-white">
                          <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                          <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold">
                            契合度 {99 - idx * (Math.floor(Math.random() * 2) + 1)}%
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-800 truncate">{item.name}</h4>
                          <span className="text-[9px] text-purple-500 font-medium">{item.rarity || '传奇'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {analysis?.recommendedTypes && (
                    <div className="flex flex-wrap gap-2 mt-2 px-1">
                      {analysis.recommendedTypes.map((type, i) => (
                        <span key={i} className="text-[10px] bg-white px-3 py-1 rounded-full text-gray-500 border border-pink-100">
                          #{type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮区 (始终保持底部) */}
            <div className="px-6 pb-12 pt-4 bg-[#FFF5F7] border-t border-pink-100/50">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onBack}
                  className="py-4 bg-white rounded-full text-gray-500 font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span className="text-lg">📔</span>
                  暂存记忆
                </button>
                <button
                  onClick={handleDownloadPNG}
                  disabled={isDownloading}
                  className="py-4 bg-pink-500 rounded-full text-white font-bold text-sm shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDownloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      导出图片
                    </>
                  )}
                </button>
              </div>
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
          className={`w-10 h-10 rounded-xl flex items-center justify-center pointer-events-auto active:scale-90 transition-all ${step === "result"
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
        {/* <div className="text-center">
          <span
            className={`text-[9px] uppercase tracking-[0.2em] font-bold block mb-1 transition-colors ${step === "result"
              ? "text-pink-500 drop-shadow-sm"
              : "text-white/40"
              }`}>
            Mirror Lab
          </span>
          <h2
            className={`font-black tracking-tight transition-all ${step === "result"
              ? "text-gray-900 text-xl drop-shadow-sm"
              : "text-white text-lg"
              }`}>
            AI 美学实验室
          </h2>
        </div> */}
        <div className="w-10 h-10"></div>
      </div>
      {renderContent()}

      {/* 温馨的使用限制提示模态框 */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-16 h-16 bg-pink-200 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-purple-200 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-yellow-200 rounded-full"></div>
            </div>

            {/* 主要内容 */}
            <div className="relative z-10">
              {/* 魔法图标 */}
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl animate-bounce">🪄</span>
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-black text-gray-800 mb-2">
                魔法能量休息中 ✨
              </h3>

              {/* 说明文字 */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                为了保证每位魔法师都能享受到优质的服务，我们为每位访客准备了
                <span className="font-bold text-pink-500">4次/小时</span>
                的魔法体验机会。
              </p>

              {/* 温馨提示 */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  🌸 请稍作休息，品一杯暖茶，或是欣赏窗外的风景。
                  <br />
                  🌟 魔法能量很快就会恢复哦！
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold transition-all active:scale-95">
                  我知道了
                </button>
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    setStep("upload");
                  }}
                  className="flex-1 py-3 px-6 magic-gradient text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95">
                  返回主页
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TryOnScreen;
