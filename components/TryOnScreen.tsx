
import React, { useState, useRef } from 'react';
import { analyzeHand } from '../services/geminiService';
import { HandAnalysis } from '../types';

interface TryOnScreenProps {
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'ring', name: '戒指美学分析', icon: '💍', desc: '基于手型推荐最适合的指环设计' },
  { id: 'bracelet', name: '手链美学分析', icon: '✨', desc: '通过腕部线条定制饰品风格' },
];

const TryOnScreen: React.FC<TryOnScreenProps> = ({ onBack }) => {
  const [step, setStep] = useState<'category' | 'upload' | 'analyzing' | 'result'>('category');
  const [activeCategory, setActiveCategory] = useState('ring');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    setStep('upload');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setImage(base64);
        setStep('analyzing');
        try {
          const result = await analyzeHand(base64, activeCategory);
          setAnalysis(result);
          setStep('result');
        } catch (error) {
          console.error("Analysis failed", error);
          alert("分析失败，请检查网络或更换照片重试");
          setStep('upload');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!analysis || !image) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = image;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 设置画布大小 (1080 x 1920 高清海报比例)
      canvas.width = 1080;
      canvas.height = 1920;

      // 绘制背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制用户上传图片 (占据上半部分)
      const imgHeight = (canvas.width / img.width) * img.height;
      ctx.drawImage(img, 0, 0, canvas.width, imgHeight);

      // 绘制半透明渐变遮罩
      const gradient = ctx.createLinearGradient(0, imgHeight - 200, 0, imgHeight);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, imgHeight - 200, canvas.width, 200);

      // 绘制文字内容
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 60px "Noto Sans SC"';
      ctx.fillText(analysis.shape, 80, imgHeight + 100);

      ctx.fillStyle = '#FF3366';
      ctx.font = 'bold 30px "Noto Sans SC"';
      ctx.fillText('DIAGNOSIS RESULT', 80, imgHeight + 30);

      // 绘制特点标签
      let currentX = 80;
      ctx.font = '40px "Noto Sans SC"';
      analysis.features.forEach((feature) => {
        const textWidth = ctx.measureText(feature).width;
        ctx.fillStyle = '#F3F4F6';
        ctx.roundRect?.(currentX - 20, imgHeight + 160, textWidth + 40, 70, 15);
        ctx.fill();
        ctx.fillStyle = '#374151';
        ctx.fillText(feature, currentX, imgHeight + 210);
        currentX += textWidth + 80;
      });

      // 绘制美学建议
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 35px "Noto Sans SC"';
      ctx.fillText('专业美学建议', 80, imgHeight + 320);
      
      ctx.fillStyle = '#1F2937';
      ctx.font = '32px "Noto Sans SC"';
      const words = analysis.recommendations.split('');
      let line = '';
      let y = imgHeight + 380;
      for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n];
        let metrics = ctx.measureText(testLine);
        if (metrics.width > 920 && n > 0) {
          ctx.fillText(line, 80, y);
          line = words[n];
          y += 50;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 80, y);

      // 绘制推荐类型
      y += 120;
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 35px "Noto Sans SC"';
      ctx.fillText('推荐首饰类型', 80, y);
      y += 60;
      
      analysis.recommendedTypes.forEach((type, idx) => {
        ctx.fillStyle = '#F9FAFB';
        ctx.roundRect?.(80, y, 920, 100, 20);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 36px "Noto Sans SC"';
        ctx.fillText(`${idx + 1}. ${type}`, 120, y + 65);
        y += 130;
      });

      // 页脚
      ctx.fillStyle = '#FF3366';
      ctx.font = 'bold 30px "Noto Sans SC"';
      ctx.fillText('MAGIC ACCESSORY 幻饰姬 AI 实验室', canvas.width / 2 - 250, 1850);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Hand-Analysis-Report-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'category':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c] animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-white text-3xl font-black mb-2 tracking-tight">AI 美学实验室</h2>
              <p className="text-white/40 text-sm font-medium tracking-wide">请选择您想要进行分析的饰品品类</p>
            </div>
            <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="group relative overflow-hidden rounded-[32px] p-6 bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl">
                      {cat.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-bold text-lg">{cat.name}</h4>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">Professional Analysis</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c] animate-fade-in">
            <button onClick={() => setStep('category')} className="absolute top-24 left-8 text-white/40 text-xs font-bold flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               返回重选分类
            </button>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/5] rounded-[48px] border-2 border-dashed border-pink-500/30 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden active:bg-white/10 transition-colors"
            >
              <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">上传{activeCategory === 'ring' ? '手部' : '手腕'}照片</h3>
              <p className="text-white/40 text-sm mb-8 text-center px-12">AI 将分析您的骨骼线条与肤色基因</p>
              <div className="px-10 py-4 magic-gradient rounded-3xl text-white font-black shadow-lg shadow-pink-500/20">
                开始 AI 诊断
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
          </div>
        );

      case 'analyzing':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0c]">
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
            </div>
            <h3 className="text-white text-xl font-black mb-4 tracking-widest animate-pulse">正在解码美学基因...</h3>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto hide-scrollbar">
            <div className="relative h-[40vh] flex-shrink-0">
              <img src={image!} className="w-full h-full object-cover" alt="Uploaded" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>
              <button 
                onClick={() => setStep('category')}
                className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-2xl text-xs font-bold"
              >
                重新分析
              </button>
            </div>
            
            <div className="px-6 -mt-10 relative z-10 pb-12">
              <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(255,51,102,0.1)] p-8 border border-pink-50">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-1 block">Diagnosis Result</span>
                    <h2 className="text-gray-900 text-3xl font-black">{analysis?.shape}</h2>
                  </div>
                  <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl">
                    {activeCategory === 'ring' ? '💍' : '✨'}
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">形态特征描述</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis?.features.map((feature, i) => (
                        <div key={i} className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 text-sm font-medium border border-gray-100">
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">专业美学建议</h4>
                    <div className="bg-pink-50/20 rounded-[24px] p-6 relative">
                      <p className="text-gray-800 text-sm leading-relaxed font-medium italic">
                        {analysis?.recommendations}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">推荐饰品类型</h4>
                      <span className="text-[8px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">TOP MATCH</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {analysis?.recommendedTypes.map((type, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group active:scale-[0.98] transition-all">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">
                            {activeCategory === 'ring' ? '💍' : '✨'}
                          </div>
                          <span className="text-gray-900 font-bold text-sm">{type}</span>
                          <div className="ml-auto opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-12">
                  <button 
                    onClick={onBack}
                    className="py-5 bg-gray-100 rounded-[24px] text-gray-600 font-black active:scale-95 transition-all"
                  >
                    确认报告
                  </button>
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="py-5 magic-gradient rounded-[24px] text-white font-black shadow-xl shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    )}
                    {isDownloading ? '生成中...' : '下载报告'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[60] flex flex-col font-sans overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none transition-opacity ${step === 'result' ? 'opacity-0' : 'opacity-100'}`}>
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <span className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-bold block mb-1">Mirror Lab</span>
          <h2 className="text-white font-black text-lg tracking-tight">AI 美学实验室</h2>
        </div>
        <div className="w-10 h-10"></div>
      </div>
      {renderContent()}
    </div>
  );
};

export default TryOnScreen;
