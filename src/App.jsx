import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Search, TrendingUp, DollarSign, BarChart2, Save, History, Calendar, Trash2 } from 'lucide-react';

// 🔥 [중요] 유정님의 Firebase 설정값을 그대로 유지합니다.
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
  // --- 상태 관리: 현재 입력 및 시뮬레이션 ---
  const [stockName, setStockName] = useState('삼성전자');
  const [eps, setEps] = useState(5000);
  const [targetPer, setTargetPer] = useState(15.0);
  const [growth, setGrowth] = useState(10);
  const [targetPeg, setTargetPeg] = useState(1.2);
  
  // --- 상태 관리: 데이터베이스 기록 ---
  const [valuationHistory, setValuationHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // --- 3대 가치 평가 계산 로직 ---
  const results = useMemo(() => {
    const relative = eps * targetPer;
    const pegValue = eps * growth * targetPeg;
    const graham = eps * (8.5 + 2 * growth);
    return { relative, pegValue, graham };
  }, [eps, targetPer, growth, targetPeg]);

  // --- Firebase에서 기록 불러오기 ---
  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "valuation_records"), orderBy("createdAt", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setValuationHistory(data);
    } catch (e) {
      console.error("기록 로드 실패:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- 기록 저장하기 ---
  const handleSave = async () => {
    if (!stockName) return alert("기업명을 입력해주세요!");
    setIsSaving(true);
    try {
      await addDoc(collection(db, "valuation_records"), {
        stockName,
        eps,
        targetPer,
        growth,
        targetPeg,
        ...results,
        createdAt: new Date()
      });
      fetchHistory(); // 목록 갱신
      alert(`${stockName} 분석 결과가 저장되었습니다! ✨`);
    } catch (e) {
      alert("저장 실패. Firebase 보안 규칙을 확인해주세요.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 메인 대시보드 카드 */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <header className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="text-blue-400" /> Valuation Intelligence Suite
              </h1>
              <p className="text-slate-400 text-sm mt-1">실시간 시뮬레이션 및 분석 데이터베이스</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Save size={18} /> {isSaving ? "저장 중..." : "분석 결과 저장"}
            </button>
          </header>

          <div className="p-8">
            {/* 기업 기본 정보 입력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-b border-slate-100 pb-10">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Search size={14} /> 분석 기업명
                </label>
                <input 
                  type="text" value={stockName} 
                  onChange={(e) => setStockName(e.target.value)}
                  className="text-2xl font-bold border-b-2 border-slate-200 focus:border-blue-500 outline-none pb-2 transition-all"
                  placeholder="예: 삼성전자"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <DollarSign size={14} /> 현재 주당순이익 (EPS)
                </label>
                <div className="flex items-center gap-2 border-b-2 border-slate-200 focus-within:border-blue-500 transition-all">
                  <span className="text-2xl font-bold text-slate-300">₩</span>