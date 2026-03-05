import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Lock, Unlock, X, Play, Square, SkipForward, Download, Upload } from 'lucide-react';

// --- 型定義 ---
interface Desk {
  id: string;
  row: number;
  col: number;
  studentName: string;
  isFixed: boolean;
  isExcluded: boolean;
}

const SOUNDS = {
  START: 'slot_start.mp3',
  STOP: 'slot_stop.mp3',
  FINISH: 'slot_finish.mp3',
};

export default function SeatShuffleApp() {
  // --- 状態管理 ---
  const [rows, setRows] = useState(7);
  const [cols, setCols] = useState(6);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [stoppingIndex, setStoppingIndex] = useState<number | null>(null);
  const [shufflingNames, setShufflingNames] = useState<Record<string, string>>({});
  
  const finalResultsRef = useRef<Record<string, string>>({});

  // 名前リスト管理（統合用）
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  // --- 初期化ロジック ---
  useEffect(() => {
    setDesks(prev => {
      const newDesks = [...prev.filter(d => d.row < rows && d.col < cols)];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!newDesks.find(d => d.row === r && d.col === c)) {
            newDesks.push({
              id: `desk-${r}-${c}-${Math.random().toString(36).substring(2, 9)}`,
              row: r, col: c, studentName: '', isFixed: false, isExcluded: false
            });
          }
        }
      }
      return newDesks.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
    });
  }, [rows, cols]);

  const activeDesks = useMemo(() => desks.filter(d => !d.isExcluded), [desks]);
  
  // --- ハンドラ ---
  const updateDesk = (id: string, updates: Partial<Desk>) => {
    setDesks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const playSound = (fileName: string) => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/sounds/${fileName}`);
    audio.play().catch(() => {});
  };

  // --- シャッフルロジック ---
  const startShuffle = () => {
    if (names.length === 0) return alert("メンバーを入力してください");
    if (names.length > activeDesks.length) return alert("席が足りません");

    playSound(SOUNDS.START);
    setIsShuffling(true);
    setStoppingIndex(0);

    // 固定されていない名前と席の抽出
    const fixedDesks = activeDesks.filter(d => d.isFixed && d.studentName);
    const fixedNames = fixedDesks.map(d => d.studentName);
    const availableNames = names.filter(n => !fixedNames.includes(n)).sort(() => Math.random() - 0.5);

    const results: Record<string, string> = {};
    let nameIdx = 0;
    desks.forEach(d => {
      if (d.isExcluded) return;
      if (d.isFixed) {
        results[d.id] = d.studentName;
      } else {
        results[d.id] = availableNames[nameIdx] || "";
        nameIdx++;
      }
    });
    finalResultsRef.current = results;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isShuffling) {
      interval = setInterval(() => {
        const nextShuffling: Record<string, string> = {};
        desks.forEach((d, idx) => {
          if (!d.isExcluded && !d.isFixed && (stoppingIndex === null || idx >= stoppingIndex)) {
            nextShuffling[d.id] = names[Math.floor(Math.random() * names.length)] || "???";
          }
        });
        setShufflingNames(nextShuffling);
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isShuffling, stoppingIndex, desks, names]);

  const stopNext = () => {
    if (stoppingIndex === null) return;
    playSound(SOUNDS.STOP);
    let nextIdx = stoppingIndex + 1;
    while (nextIdx < desks.length && (desks[nextIdx].isExcluded || desks[nextIdx].isFixed)) {
      nextIdx++;
    }
    if (nextIdx >= desks.length) finishShuffle();
    else setStoppingIndex(nextIdx);
  };

  const finishShuffle = () => {
    setIsShuffling(false);
    setStoppingIndex(null);
    setDesks(prev => prev.map(d => ({
      ...d,
      studentName: finalResultsRef.current[d.id] ?? d.studentName
    })));
    playSound(SOUNDS.FINISH);
  };

  // --- 保存・読込 ---
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ rows, cols, desks, names })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seats-config.json`;
    a.click();
  };

  return (
    <div className="App" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', padding: '20px' }}>
      {/* ヘッダーエリア */}
      <div className="tool_head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="tool_title" style={{ margin: 0 }}>席替えスロットル PRO</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}>
            <Download size={16}/> 保存
          </button>
          {!isShuffling ? (
            <button onClick={startShuffle} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              <Play size={16}/> スタート
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={stopNext} style={{ backgroundColor: '#f97316', color: '#fff', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>次を停止</button>
              <button onClick={finishShuffle} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>一括停止</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
        有効座席数: {activeDesks.length} 席 / メンバー: {names.length} 名
      </div>

      {/* メインテーブルエリア（レイアウト修正版） */}
      <div className="table_area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          
          {/* 教卓 */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '20px', paddingRight: '60px', paddingLeft: '60px', boxSizing: 'border-box' }}>
            <div style={{ width: '120px', height: '60px', backgroundColor: 'white', border: '2px solid black', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>教 卓</div>
          </div>

          {/* 列削除 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', marginLeft: '60px' }}>
            {[...Array(cols)].map((_, c) => (
              <button key={c} onClick={() => setCols(v => Math.max(1, v - 1))} style={{ width: '94px', height: '30px', backgroundColor: '#ff6b6b', color: '#fff', border: '2px solid #c92a2a', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>列削除</button>
            ))}
          </div>

          {/* 座席グリッド + 列追加 */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(rows)].map((_, r) => (
                <div key={r} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => setRows(v => Math.max(1, v - 1))} style={{ width: '50px', height: '64px', backgroundColor: '#ff6b6b', color: '#fff', border: '2px solid #c92a2a', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>行削除</button>
                  {[...Array(cols)].map((_, c) => {
                    const desk = desks.find(d => d.row === r && d.col === c);
                    if (!desk) return null;
                    const isStopping = isShuffling && stoppingIndex !== null && desks.indexOf(desk) < stoppingIndex;
                    const displayVal = isShuffling ? (isStopping || desk.isFixed ? (finalResultsRef.current[desk.id] || "") : shufflingNames[desk.id]) : desk.studentName;

                    return (
                      <div key={desk.id} style={{ position: 'relative', width: '94px', height: '64px', border: '2px solid #333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: desk.isExcluded ? '#333' : '#fff', cursor: 'pointer', boxSizing: 'border-box' }} onClick={() => !isShuffling && updateDesk(desk.id, { isExcluded: !desk.isExcluded })}>
                        {!desk.isExcluded && (
                          <>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: desk.isFixed ? '#b45309' : '#000' }}>{displayVal || `${r+1}-${c+1}`}</span>
                            <div onClick={(e) => { e.stopPropagation(); updateDesk(desk.id, { isFixed: !desk.isFixed }); }} style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', backgroundColor: desk.isFixed ? '#FFD700' : '#eee', border: '1px solid #000', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {desk.isFixed ? <Lock size={12}/> : <Unlock size={12}/>}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <button onClick={() => setCols(v => v + 1)} style={{ width: '50px', height: `${rows * 64 + (rows - 1) * 10}px`, backgroundColor: '#4CAF50', color: '#fff', border: '2px solid #2E7D32', borderRadius: '4px', fontWeight: 'bold', writingMode: 'vertical-rl', cursor: 'pointer' }}>列追加</button>
          </div>

          {/* 行追加 */}
          <button onClick={() => setRows(v => v + 1)} style={{ width: `${cols * 94 + (cols - 1) * 10}px`, height: '50px', backgroundColor: '#4CAF50', color: '#fff', border: '2px solid #2E7D32', borderRadius: '4px', fontWeight: 'bold', marginLeft: '60px', cursor: 'pointer' }}>行追加</button>
        </div>
      </div>

      {/* メンバー管理 */}
      <div style={{ marginTop: '40px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h3>メンバー一覧 ({names.length}名)</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="名前を入力" style={{ flex: 1, padding: '8px' }} />
          <button onClick={() => { if(newName.trim()){ setNames([...names, newName.trim()]); setNewName(""); } }} style={{ padding: '8px 20px' }}>追加</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {names.map((n, i) => (
            <div key={i} style={{ padding: '5px 10px', backgroundColor: '#f3f4f6', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {n} <X size={14} style={{ cursor: 'pointer' }} onClick={() => setNames(names.filter((_, idx) => idx !== i))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}