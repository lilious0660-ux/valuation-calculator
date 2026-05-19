import React, { useState, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip } from 'recharts';

const firebaseConfig = {
  apiKey: "AIzaSyBh6lx-cPvoxntoVOwfXLg9_MqbEdZSwv8",
  authDomain: "share-price-calculate.firebaseapp.com",
  projectId: "share-price-calculate",
  storageBucket: "share-price-calculate.firebasestorage.app",
  messagingSenderId: "446144023268",
  appId: "1:446144023268:web:d1b2d027ffabf74617baf1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [eps, setEps] = useState(14.12);
  const [targetPer, setTargetPer] = useState(28.11);
  const [growth, setGrowth] = useState(13);
  const [targetPeg, setTargetPeg] = useState(1.5);
  const [discountRate, setDiscountRate] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  const valuation = useMemo(() => {
    const relative = eps * targetPer;          
    const peg = eps * growth * targetPeg;       
    const graham = eps * (8.5 + 2 * growth);    
    return { relative, peg, graham };
  }, [eps, targetPer, growth, targetPeg]);

  const chartData = useMemo(() => {
    const data = [];
    for (let g = 0; g <= 50; g += 5) {
      data.push({
        name: g,
        value: Math.round(eps * (8.5 + 2 * g))
      });
    }
    return data;
  }, [eps]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, "valuation_history"), {
        eps, targetPer, growth, targetPeg, discountRate,
        ...valuation,
        createdAt: new Date()
      });
      alert("성공적으로 Firebase에 분석 결과가 저장되었습니다! ✨");
    } catch (error) {
      console.error(error);
      alert("저장 실패: Firebase 설정을 다시 확인해 주세요.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 font-sans flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-[#161925] rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800/80">
        
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold text-slate-400 tracking-wider">SK하이닉스, 인텔 메모리 사업 인수 과정 분석</h2>
          <p className="text-[11px] text-emerald-400 mt-1">정상 성장 범위: 빅테크 기업의 평균적 성장 기대치입니다.</p>
        </div>

        <div className="h-64 w-full mb-8 bg-[#1B1E2E]/40 rounded-2xl p-4 border border-slate-800/50">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[
              { name: '상대가치', value: Math.round(valuation.relative), label: 'EPS × 목표 PER' },
              { name: 'PEG 가치', value: Math.round(valuation.peg), label: 'PER 19.5 적용' },
              { name: '그레이엄', value: Math.round(valuation.graham), label: '공식 성장 가치' }
            ]}>
              <XAxis dataKey="name" stroke="#64748B" fontSize={13} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} domain={[0, 600]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E2235', borderColor: '#334155', borderRadius: '12px' }}
                formatter={(value) => [`$${value.toLocaleString()}`, '적정주가']}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[10, 10, 0, 0]} maxBarSize={60} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-base font-bold text-white">성장률(g)에 따른 내재가치 변화 <span className="text-xs text-blue-400 font-normal">(폭등 지점 확인)</span></h3>
            <span className="text-xs text-slate-500">↑ 내재가치 ($)</span>
          </div>
          <div className="h-44 w-full bg-[#1B1E2E]/40 rounded-2xl p-2 border border-slate-800/50 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 1500]} />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-red-500/5 rounded-r-2xl border-l border-red-500/10 pointer-events-none flex items-center justify-content-center">
              <span className="text-[10px] text-red-400/40 font-semibold tracking-wider">비현실적 성장 구역 (g &gt; 25%)</span>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-medium">
              현재 설정된 성장률: {growth}% ➡️ 예상 내재가치: ${Math.round(valuation.graham).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#121420] p-6 rounded-2xl border border-slate-800/60">
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">현재 EPS ($)</span>
              <span className="text-blue-400 font-bold">{eps}</span>
            </div>
            <input 
              type="number" step="0.01" value={eps} 
              onChange={(e) => setEps(parseFloat(e.target.value) || 0)}
              className="bg-[#1B1E2E] border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2 justify-center">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">목표 PER</span>
              <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">{targetPer}</span>
            </div>
            <input 
              type="range" min="1" max="60" step="0.01" value={targetPer} 
              onChange={(e) => setTargetPer(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 justify-center">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">장기 성장률 (%)</span>
              <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">{growth}%</span>
            </div>
            <input 
              type="range" min="0" max="50" step="1" value={growth} 
              onChange={(e) => setGrowth(parseInt(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 justify-center">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">목표 PEG</span>
              <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">{targetPeg}</span>
            </div>
            <input 
              type="range" min="0.1" max="4.0" step="0.1" value={targetPeg} 
              onChange={(e) => setTargetPeg(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 justify-center md:col-span-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">할인율 (%)</span>
              <span className="text-slate-400 font-mono font-bold">{discountRate}%</span>
            </div>
            <input 
              type="range" min="1" max="20" step="1" value={discountRate} 
              onChange={(e) => setDiscountRate(parseInt(e.target.value) || 10)}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
        >
          {isSaving ? "데이터베이스 전송 중..." : "시뮬레이션 결과 클라우드 저장"}
        </button>

      </div>
    </div>
  );
}