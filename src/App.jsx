import React, { useState, useEffect } from 'react';
import { Calculator, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDC7tiCwwIwZA0X1SrZpmclAkXUBKWieP4",
  authDomain: "share-price-calcualte.firebaseapp.com",
  projectId: "share-price-calcualte",
  storageBucket: "share-price-calcualte.firebasestorage.app",
  messagingSenderId: "1002617795385",
  appId: "1:1002617795385:web:896fea07fe347ebb14aee8",
  measurementId: "G-4KT4ZV7TP8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [inputs, setInputs] = useState({
    companyName: '',
    eps: '',
    bps: '',
    per: '',
    pbr: '',
    growthRate: '',
    discountRate: '10'
  });
  
  const [history, setHistory] = useState([]);
  const [expandedCompany, setExpandedCompany] = useState(null);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "valuations"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const calculateGrowthMultiple = (g, r) => {
    let multiple = 0;
    const growth = g / 100;
    const discount = r / 100;
    for (let t = 1; t <= 10; t++) {
      multiple += Math.pow(1 + growth, t) / Math.pow(1 + discount, t);
    }
    return multiple;
  };

  const calculateValues = () => {
    const eps = Number(inputs.eps) || 0;
    const bps = Number(inputs.bps) || 0;
    const per = Number(inputs.per) || 0;
    const pbr = Number(inputs.pbr) || 0;
    const g = Number(inputs.growthRate) || 0;
    const r = Number(inputs.discountRate) || 10;

    const revenueValue = eps * per;
    const assetValue = bps * pbr;
    const multiple = calculateGrowthMultiple(g, r);
    const growthValue = eps * multiple;

    return { revenueValue, assetValue, growthValue };
  };

  const handleSave = async () => {
    if (!inputs.companyName) {
      alert("기업명을 입력해주세요!");
      return;
    }
    const results = calculateValues();
    const newData = {
      ...inputs,
      ...results,
      date: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "valuations"), newData);
      fetchHistory();
      alert("저장되었습니다!");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "valuations", id));
      fetchHistory();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const loadHistoryItem = (item) => {
    setInputs({
      companyName: item.companyName || '',
      eps: item.eps || '',
      bps: item.bps || '',
      per: item.per || '',
      pbr: item.pbr || '',
      growthRate: item.growthRate || '',
      discountRate: item.discountRate || '10'
    });
  };

  const toggleCompany = (companyName) => {
    if (expandedCompany === companyName) {
      setExpandedCompany(null);
    } else {
      setExpandedCompany(companyName);
    }
  };

  const { revenueValue, assetValue, growthValue } = calculateValues();

  // 히스토리를 기업별로 그룹화
  const groupedHistory = history.reduce((acc, item) => {
    if (!acc[item.companyName]) {
      acc[item.companyName] = [];
    }
    acc[item.companyName].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 헤더 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calculator size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">종합 적정주가 계산기</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 왼쪽: 데이터 입력 패널 */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-3">데이터 입력</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">기업명</label>
                <input type="text" name="companyName" value={inputs.companyName} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="예: 삼성전자" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">EPS (원 또는 $)</label>
                  <input type="number" name="eps" value={inputs.eps} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">PER (배)</label>
                  <input type="number" name="per" value={inputs.per} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">BPS (원 또는 $))</label>
                  <input type="number" name="bps" value={inputs.bps} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">PBR (배)</label>
                  <input type="number" name="pbr" value={inputs.pbr} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-600 mb-1">예상 영업이익 성장률 (%)</label>
                <input type="number" name="growthRate" value={inputs.growthRate} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex justify-between">
                  <span>할인율 (%)</span>
                  <span className="text-xs text-gray-400 font-normal">*통상 10% 적용</span>
                </label>
                <input type="number" name="discountRate" value={inputs.discountRate} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10" />
              </div>
              <button onClick={handleSave} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm">
                결과 저장하기
              </button>
            </div>
          </div>

          {/* 오른쪽: 결과 및 히스토리 패널 */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 결과 카드 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 수익가치 카드 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-gray-500 font-medium text-sm mb-2">수익가치 기반 적정주가</h3>
                <p className="text-3xl font-bold text-gray-900 mb-4">
                  {Math.floor(revenueValue).toLocaleString()} <span className="text-lg font-normal text-gray-500">원 또는 $</span>
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 text-center font-medium">공식: EPS * PER</p>
                </div>
              </div>

              {/* 자산가치 카드 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <h3 className="text-gray-500 font-medium text-sm mb-2">자산가치 기반 적정주가</h3>
                <p className="text-3xl font-bold text-gray-900 mb-4">
                  {Math.floor(assetValue).toLocaleString()} <span className="text-lg font-normal text-gray-500">원 또는 $</span>
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 text-center font-medium">공식: BPS * PBR</p>
                </div>
              </div>

              {/* 성장 적정주가 카드 */}
              <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white/10 text-white/90 text-xs px-3 py-1.5 rounded-bl-xl font-medium backdrop-blur-sm">
                  영업이익 성장률 및 DCF 기반
                </div>
                <h3 className="text-indigo-200 font-medium text-sm mb-2">성장 적정주가</h3>
                <p className="text-5xl font-bold text-white mb-6">
                  {Math.floor(growthValue).toLocaleString()} <span className="text-2xl font-normal text-indigo-200">원 또는 $</span>
                </p>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                  <p className="text-sm text-indigo-100 text-center font-medium tracking-wide">
                    공식: multiple * EPS
                  </p>
                </div>
              </div>
            </div>

            {/* 분석 히스토리 아코디언 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <History className="text-gray-400" size={20} />
                <h2 className="text-lg font-bold text-gray-800">분석 히스토리</h2>
              </div>
              
              {Object.keys(groupedHistory).length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-sm">저장된 분석 기록이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedHistory).map(([company, items]) => (
                    <div key={company} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                      <button 
                        onClick={() => toggleCompany(company)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-bold text-gray-800">{company} <span className="text-sm font-normal text-blue-500 ml-2">({items.length}건)</span></span>
                        {expandedCompany === company ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                      </button>
                      
                      {expandedCompany === company && (
                        <div className="p-4 space-y-3 bg-gray-50 border-t border-gray-100">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div 
                                onClick={() => loadHistoryItem(item)}
                                className="flex-1 bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                    {new Date(item.date).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">클릭하여 불러오기</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <p className="text-gray-400 text-xs">수익가치</p>
                                    <p className="font-semibold text-gray-700">{Math.floor(item.revenueValue).toLocaleString()}원 또는 $</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-xs">자산가치</p>
                                    <p className="font-semibold text-gray-700">{Math.floor(item.assetValue).toLocaleString()}원 또는 $</p>
                                  </div>
                                  <div>
                                    <p className="text-indigo-400 text-xs">성장가치</p>
                                    <p className="font-bold text-indigo-600">{Math.floor(item.growthValue).toLocaleString()}원 또는 $</p>
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => handleDelete(item.id)} className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors bg-white border border-gray-100">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
