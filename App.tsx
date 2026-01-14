import React, { useState } from "react";
import { ACCESSORIES } from "./constants";
import { AppTab } from "./types";
import Navigation from "./components/Navigation";
import TryOnScreen from "./components/TryOnScreen";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative shadow-2xl bg-white overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 magic-gradient rounded-full flex items-center justify-center text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-gray-800">
              幻饰姬
            </h1>
            <p className="text-pink-500 text-[10px] font-medium">魔法首饰</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800 border border-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800 border border-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      {/*       
      <div className="px-6 mb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center">
            <span className="text-xl">🐵</span>
          </div>
          <input
            type="text"
            placeholder="搜索魔法道具..."
            className="w-full bg-white border border-pink-100 rounded-full py-4 pl-12 pr-4 focus:ring-2 focus:ring-pink-200 outline-none shadow-sm placeholder-gray-300 text-sm"
          />
        </div>
      </div>
      */}

      {/* Hero Banner */}
      <div className="px-6 mb-8">
        <div className="relative rounded-[40px] overflow-hidden shadow-2xl h-64 group cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000&q=80&auto=format&fit=crop"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt="Magic Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          {/* <div className="absolute top-6 left-6">
            <span className="bg-pink-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              新品速递
            </span>
          </div> */}
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h2 className="text-3xl font-bold mb-2">魔法少女系列</h2>
            <p className="text-sm opacity-80 mb-4">
              使用AI试戴，开启你的华丽蜕变。
            </p>
            <div className="relative">
              {/* 魔法光环效果 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-50 blur-xl animate-pulse"></div>
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300 to-pink-400 opacity-30 blur-lg animate-ping"
                style={{ animationDuration: "2s" }}></div>

              {/* 主要按钮 */}
              <button
                onClick={() => setActiveTab("tryon")}
                className="relative bg-gradient-to-r from-white/80 to-pink-50/70 text-pink-600 px-10 py-4 rounded-full font-black text-lg shadow-2xl border-2 border-white/40 backdrop-blur-sm hover:shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all duration-300 group overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  <span className="animate-bounce">👆</span>
                  <span>立即体验魔法</span>
                  <span className="animate-bounce delay-100">✨</span>
                </span>

                {/* 按钮内部光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>

              {/* 提示文字 */}
              <div className="text-center mt-3 opacity-90">
                <p className="text-xs font-medium animate-pulse">
                  点击开始你的魔法之旅！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 flex justify-between mb-10 overflow-x-auto hide-scrollbar gap-4">
        {[
          { icon: "🌸", name: "戒指", color: "bg-pink-100 text-pink-500" },
          { icon: "☀️", name: "项圈", color: "bg-purple-100 text-purple-500" },
          { icon: "〰️", name: "手链", color: "bg-blue-100 text-blue-500" },
          { icon: "⭐", name: "发卡", color: "bg-yellow-100 text-yellow-500" },
          { icon: "✨", name: "魔杖", color: "bg-green-100 text-green-500" },
        ].map((cat, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 flex-shrink-0">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm ${cat.color}`}>
              {cat.icon}
            </div>
            <span className="text-xs font-bold text-gray-700">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Hot Items */}
      <div className="px-6 mb-4 flex justify-between items-center">
        <h3 className="text-2xl font-black text-gray-900">热门单品</h3>
        <button className="text-pink-500 text-xs font-bold">查看全部</button>
      </div>

      <div className="px-6 grid grid-cols-2 gap-6">
        {ACCESSORIES.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 group">
            <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 shadow-sm border border-gray-100">
              <img
                src={item.image}
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                alt={item.name}
              />
              <button className="absolute top-4 right-4 w-10 h-10 glass-card rounded-full flex items-center justify-center text-gray-800 shadow-sm active:scale-90">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
            <div>
              <p className="text-[10px] text-purple-600 font-bold mb-1">
                {item.tag}
              </p>
              <h4 className="font-bold text-gray-900 mb-2 truncate">
                {item.name}
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-500 rounded-md font-bold">
                  {item.rarity}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-xs font-bold text-gray-400">
                    {item.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Overlays */}
      {activeTab === "tryon" && (
        <TryOnScreen onBack={() => setActiveTab("home")} />
      )}

      {/* Footer Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
