import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, DollarSign, BarChart2, ListPlus, History, Calendar } from 'lucide-react';

export default function App() {
  // --- 상태 관리: 현재 입력 및 시뮬레이션 ---
  const [stockName, setStockName] = useState('삼성전자');
  const [eps, setEps] = useState(5000);
  const [targetPer, setTargetPer] = useState(15.0);
  const [growth, setGrowth] = useState(10);
  const [targetPeg, setTargetPeg] = useState(1.2);
  
  // --- 상태 관리: 로컬 리스트 기록 (클라우드 X) ---
  const [valuationHistory, setValuationHistory] = useState([]);

  // --- 3대 가치 평가 계산 로직 ---
  const results = useMemo(() => {
    const relative = eps * targetPer;
    const pegValue = eps * growth * targetPeg;
    const graham = eps * (8.5 + 2 * growth);
    return { relative, pegValue, graham };
  }, [eps, targetPer, growth, targetPeg]);

  // --- 결과 리스트에 추가하기 (새로고침 전까지 유지) ---
  const handleAddToList = () => {
    if (!stockName) return alert("기업명을 입력해주세요!");
    
    const newRecord = {
      id: Date.now(),
      stockName,
      eps,
      targetPer,
      growth,
      targetPeg,
      ...results,
      createdAt: new Date()
    };

    // 최신 기록이 위로 올라오도록 배열 맨 앞에 추가
    setValuationHistory([newRecord, ...valuationHistory]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* 상단 헤더 */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
              <TrendingUp className="text-blue-600 w-8 h-8" /> 기업 적정 주가 계산기
            </h1>
            <p className="text-slate-500 mt-2 font-medium">그레이엄 공식 및 PEG 기반 시뮬레이션 대시보드</p>
          </div>
        </header>

        {/* 메인 레이아웃: 좌측(시뮬레이션 2/3) / 우측(리스트 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================= 좌측: 입력 및 시뮬레이션 ================= */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. 기업 정보 입력 폼 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Search size={14} /> 분석 기업명
                  </label>
                  <input 
                    type="text" value={stockName} 
                    onChange={(e) => setStockName(e.target.value)}
                    className="text-2xl font-bold border-b-2 border-slate-200 focus:border-blue-600 outline-none pb-2 transition-all text-slate-800"
                    placeholder="예: 엔비디아"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <DollarSign size={14} /> 현재 EPS (원/$)
                  </label>
                  <div className="flex items-center gap-2 border-b-2 border-slate-200 focus-within:border-blue-600 transition-all">
                    <input 
                      type="number" step="0.01" value={eps} 
                      onChange={(e) => setEps(parseFloat(e.target.value) || 0)}
                      className="text-2xl font-bold outline-none pb-2 w-full text-slate-800"
                    />
                    <span className="text-sm font-bold text-slate-400 pb-2">(원/$)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 시각화 바 차트 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                <BarChart2 className="text-blue-600" /> 적정주가 산출 결과
              </h3>
              
              <div className="space-y-8">
                {[
                  { label: "상대가치 (PER 모델)", val: results.relative, color: "bg-slate-300", sub: `목표 PER ${targetPer}배 적용` },
                  { label: "PEG 가치 (성장성 보정)", val: results.pegValue, color: "bg-emerald-400", sub: `성장성 보정 (PEG ${targetPeg})` },
                  { label: "그레이엄 공식 (내재가치)", val: results.graham, color: "bg-blue-600", sub: "공식: EPS × (8.5 + 2g)", highlight: true }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-black ${item.highlight ? "text-blue-600" : "text-slate-800"}`}>
                          {item.val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-400 ml-1 font-bold">(원/$)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`${item.color} h-full transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min((item.val / (eps * 60)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 슬라이더 조절바 & 추가 버튼 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">목표 PER</span>
                    <span className="font-bold text-blue-600">{targetPer}배</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" step="0.5" value={targetPer} 
                    onChange={(e) => setTargetPer(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">장기 성장률 (g)</span>
                    <span className="font-bold text-blue-600">{growth}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="60" step="1" value={growth} 
                    onChange={(e) => setGrowth(parseInt(e.target.value) || 0)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">목표 PEG</span>
                    <span className="font-bold text-blue-600">{targetPeg}</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="5.0" step="0.1" value={targetPeg} 
                    onChange={(e) => setTargetPeg(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <button 
                onClick={handleAddToList}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md"
              >
                <ListPlus size={20} /> 현재 시뮬레이션 결과를 우측 리스트에 추가
              </button>
            </div>

          </div>

          {/* ================= 우측: 결과 누적 리스트 ================= */}
          <div className="lg:col-span-1 flex flex-col h-full max-h-[850px]">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <History className="text-blue-600" size={18} /> 비교 분석 리스트
                </h3>
                <p className="text-xs text-slate-400 mt-1">추가된 결과가 임시 저장됩니다.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {valuationHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <History size={40} className="mb-4 opacity-20" />
                    <p className="text-sm">버튼을 눌러 결과를 추가해보세요.</p>
                  </div>
                ) : (
                  valuationHistory.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{item.stockName}</h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar size={10} /> {item.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block mb-1">그레이엄 가치</span>
                          <span className="font-black text-blue-600 text-lg">
                            {item.graham.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">(원/$)</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 py-2 rounded-lg">
                          <span className="block text-slate-400 mb-1">EPS</span>
                          <span className="font-bold text-slate-700">{item.eps}</span>
                        </div>
                        <div className="bg-slate-50 py-2 rounded-lg">
                          <span className="block text-slate-400 mb-1">목표 PER</span>
                          <span className="font-bold text-slate-700">{item.targetPer}</span>
                        </div>
                        <div className="bg-slate-50 py-2 rounded-lg">
                          <span className="block text-slate-400 mb-1">성장률</span>
                          <span className="font-bold text-slate-700">{item.growth}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}