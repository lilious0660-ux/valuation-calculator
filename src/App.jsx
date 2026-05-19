import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, DollarSign, BarChart2, ListPlus, History, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from 'recharts';

export default function App() {
  // --- 상태 관리: 현재 입력 및 시뮬레이션 ---
  const [stockName, setStockName] = useState('삼성전자');
  const [eps, setEps] = useState(5000);
  const [targetPer, setTargetPer] = useState(15.0);
  const [growth, setGrowth] = useState(10);
  const [targetPeg, setTargetPeg] = useState(1.2);
  
  // --- 상태 관리: 로컬 리스트 기록 ---
  const [valuationHistory, setValuationHistory] = useState([]);

  // --- 3대 가치 평가 계산 로직 ---
  const results = useMemo(() => {
    const relative = eps * targetPer;
    const pegValue = eps * growth * targetPeg;
    const graham = eps * (8.5 + 2 * growth);
    return { relative, pegValue, graham };
  }, [eps, targetPer, growth, targetPeg]);

  // --- 하단 꺾은선 민감도 차트용 데이터 생성 ---
  // 데이터를 40% -> 50%까지 늘려서 비현실적 구역을 더 잘 보이게 합니다.
  const sensitivityData = useMemo(() => {
    const data = [];
    for (let g = 0; g <= 50; g += 5) {
      data.push({
        name: g,
        value: Math.round(eps * (8.5 + 2 * g))
      });
    }
    return data;
  }, [eps]);

  // --- 결과 리스트에 추가하기 ---
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
    setValuationHistory([newRecord, ...valuationHistory]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-[1500px] mx-auto">
        
        {/* 상단 헤더 */}
        <header className="mb-6 flex flex-col justify-between border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
            <TrendingUp className="text-blue-600 w-8 h-8" /> 기업 적정 주가 계산기
          </h1>
          <p className="text-slate-500 mt-2 font-medium">그레이엄 공식 및 PEG 기반 시뮬레이션 대시보드</p>
        </header>

        {/* 메인 레이아웃: 좌측(시뮬레이션 2/3) / 우측(리스트 1/3) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* ================= 좌측: 입력 및 시뮬레이션 ================= */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* 1. 기업 정보 입력 폼 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-2">
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
              <div className="flex-1 flex flex-col gap-2">
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

            {/* 2. 적정주가 결과 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "상대가치 (PER 모델)", val: results.relative, color: "text-slate-700", bg: "bg-white", border: "border-slate-200" },
                { label: "PEG 가치 (성장성 보정)", val: results.pegValue, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100" },
                { label: "그레이엄 공식 (내재가치)", val: results.graham, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "핵심 지표" }
              ].map((item, idx) => (
                <div key={idx} className={`${item.bg} ${item.border} border rounded-2xl p-6 shadow-sm relative overflow-hidden`}>
                  {item.badge && (
                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      {item.badge}
                    </span>
                  )}
                  <p className="text-xs font-bold text-slate-500 mb-1">{item.label}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-3xl font-black ${item.color}`}>
                      {item.val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-sm font-bold text-slate-400">(원/$)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Recharts 전문 차트 영역 (비현실적 구역 추가!) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 바 차트: 3대 가치 비교 */}
              <div className="flex flex-col h-72">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart2 size={16} className="text-blue-600" /> 모델별 가치 비교
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={[
                    { name: '상대가치', value: Math.round(results.relative) },
                    { name: 'PEG 가치', value: Math.round(results.pegValue) },
                    { name: '그레이엄', value: Math.round(results.graham) }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={(val) => val.toLocaleString()} />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${value.toLocaleString()} (원/$)`, '적정주가']}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 꺾은선 차트: 성장률 민감도 & 비현실적 구역 표시 */}
              <div className="flex flex-col h-72 relative">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" /> 성장률