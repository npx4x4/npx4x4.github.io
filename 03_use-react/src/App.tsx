import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lock, Unlock, Download, Play, Square, SkipForward, X, Upload } from 'lucide-react';
import './App.css';

// --- 設定値 ---
const SEAT_W = 120; // 席の幅
const SEAT_H = 80;  // 席の高さ
const GAP = 5;      // 席同士の間隔
const SIDE_BTN_W = 50; // 行削除・追加ボタンの幅

// --- サウンド再生ヘルパー ---
const playSound = (fileName: string) => {
  const audio = new Audio(`./sounds/${fileName}`);
  audio.play().catch(() => {
    const retryAudio = new Audio(`/sounds/${fileName}`);
    retryAudio.play().catch(err => console.error("Sound Error:", err));
  });
};

interface Desk {
  id: string;
  row: number;
  col: number;
  studentName: string;
  isFixed: boolean;
  isExcluded: boolean;
}

// --- スロットリール演出 ---
const SlotReel = ({ names, isSpinning, finalName }: { names: string[], isSpinning: boolean, finalName: string }) => {
  if (!isSpinning) {
    return <span style={{ fontSize: '24px', fontWeight: '900', color: '#000' }}>{finalName}</span>;
  }
  const reelNames = names.length > 0 ? [...names, ...names].slice(0, 10) : ["???"];
  return (
    <div style={{ height: '60px', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div className="reel-animation" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {reelNames.map((name, i) => (
          <div key={i} style={{ height: '60px', lineHeight: '60px', fontSize: '18px', fontWeight: 'bold', color: '#999' }}>{name}</div>
        ))}
      </div>
    </div>
  );
};

// --- 座席グリッド本体 ---
const DeskGrid = ({ 
  isResult = false, rows, cols, desks, isShuffling, stoppingIndex, allNames, finalResults, onUpdateDesk, onSetRows, onSetCols
}: { 
  isResult: boolean; rows: number; cols: number; desks: Desk[];
  isShuffling: boolean; stoppingIndex: number | null; allNames: string[];
  finalResults: Record<string, string>;
  onUpdateDesk: (id: string, updates: Partial<Desk>) => void;
  onSetRows: (val: number) => void;
  onSetCols: (val: number) => void;
}) => {
  // ズレ防止スペーサー（行削除ボタン幅 50px + 隙間 5px）
  const spacerW = SIDE_BTN_W + GAP;
  // 座席エリアのみの全幅（追加・削除ボタンを含まない）
  const gridTotalWidth = (SEAT_W * cols) + (GAP * (cols - 1));

  return (
    <div style={{ 
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', 
      background: isResult ? 'white' : 'transparent', padding: '30px', 
      borderRadius: '8px', border: 'none', minWidth: 'fit-content'
    }}>
      {/* 教卓 */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '20px' }}>
        <div style={{ width: '160px', height: '60px', backgroundColor: 'white', border: '3px solid black', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>教 卓</div>
      </div>

      {/* 列削除ボタン列 (配置と横幅を修正) */}
      {!isResult && (
        <div style={{ display: 'flex', gap: `${GAP}px`, marginBottom: `${GAP}px`, width: '100%', alignItems: 'center' }}>
          <div style={{ width: `${spacerW}px`, flexShrink: 0 }} /> {/* 左のスペーサー */}
          {[...Array(cols)].map((_, c) => (
            <button key={`col-del-${c}`} onClick={() => onSetCols(Math.max(1, cols - 1))} style={{ width: `${SEAT_W}px`, height: '30px', backgroundColor: '#f0f0f0', color: '#000', border: '3px solid black', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>列削除</button>
          ))}
          <div style={{ width: `${SIDE_BTN_W + GAP}px`, flexShrink: 0 }} /> {/* 右のスペーサー（追加ボタン分） */}
        </div>
      )}

      {/* 座席本体と横方向操作 (配置を修正) */}
      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, flexShrink: 0 }}>
          {[...Array(rows)].map((_, r) => (
            <div key={`row-${r}`} style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
              {!isResult && (
                <button onClick={() => onSetRows(Math.max(1, rows - 1))} style={{ width: `${SIDE_BTN_W}px`, height: `${SEAT_H}px`, backgroundColor: '#f0f0f0', color: '#000', border: '3px solid black', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>行削除</button>
              )}
              <div style={{ display: 'flex', gap: `${GAP}px` }}>
                {[...Array(cols)].map((_, c) => {
                  const desk = desks.find(d => d.row === r && d.col === c);
                  if (!desk) return null;
                  const deskIndex = desks.indexOf(desk);
                  const isSpinning = isShuffling && (stoppingIndex === null || deskIndex >= stoppingIndex) && !desk.isExcluded && !desk.isFixed;
                  const isStoppedAlready = isShuffling && stoppingIndex !== null && deskIndex < stoppingIndex;

                  return (
                    <div key={desk.id} style={{ 
                      position: 'relative', width: `${SEAT_W}px`, height: `${SEAT_H}px`, 
                      border: (isShuffling && stoppingIndex === deskIndex) ? '5px solid #1C8C42' : '3px solid black', 
                      borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      backgroundColor: desk.isExcluded ? '#1a1a1a' : '#fff', overflow: 'hidden', flexShrink: 0, boxSizing: 'border-box'
                    }}>
                      {!desk.isExcluded && (
                        isResult ? (
                          <SlotReel 
                            names={allNames} isSpinning={isSpinning}
                            finalName={(isStoppedAlready || !isShuffling || desk.isFixed) ? (finalResults[desk.id] || desk.studentName) : ""} 
                          />
                        ) : (
                          <>
                            <input 
                              type="text"
                              aria-label="メンバー名"
                              value={desk.studentName}
                              onChange={(e) => onUpdateDesk(desk.id, { studentName: e.target.value })} 
                              style={{ width: '90%', border: 'none', textAlign: 'center', fontSize: '16px', outline: 'none', background: 'transparent', fontWeight: 'bold' }} 
                            />
                            <div onClick={() => onUpdateDesk(desk.id, { isFixed: !desk.isFixed })} style={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer', color: desk.isFixed ? '#d97706' : '#999' }}>
                              {desk.isFixed ? <Lock size={18} strokeWidth={3} /> : <Unlock size={16} />}
                            </div>
                            <div onClick={() => onUpdateDesk(desk.id, { isExcluded: true })} style={{ position: 'absolute', bottom: '4px', right: '4px', cursor: 'pointer', color: '#999' }}>
                              <X size={16} strokeWidth={3} />
                            </div>
                          </>
                        )
                      )}
                      {isResult && desk.isFixed && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', color: '#d97706' }}>
                          <Lock size={21} strokeWidth={3} />
                        </div>
                      )}
                      {!isResult && desk.isExcluded && (
                        <div onClick={() => onUpdateDesk(desk.id, { isExcluded: false })} style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>復活</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {!isResult && (
          <button onClick={() => onSetCols(cols + 1)} style={{ width: `${SIDE_BTN_W}px`, height: `${rows * SEAT_H + (rows - 1) * GAP}px`, backgroundColor: '#1C8C42', color: '#fff', border: '3px solid black', borderRadius: '4px', fontWeight: 'bold', writingMode: 'vertical-rl', cursor: 'pointer', flexShrink: 0, marginTop: '0' }}>列追加</button>
        )}
      </div>

      {/* 行追加ボタン (配置と横幅を修正) */}
      {!isResult && (
        <div style={{ display: 'flex', gap: `${GAP}px`, marginTop: `${GAP}px`, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: `${spacerW}px`, flexShrink: 0 }} /> {/* 左のスペーサー */}
          <button onClick={() => onSetRows(rows + 1)} style={{ width: `${gridTotalWidth}px`, height: '50px', backgroundColor: '#1C8C42', color: '#fff', border: '3px solid black', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>行追加</button>
          <div style={{ width: `${SIDE_BTN_W + GAP}px`, flexShrink: 0 }} /> {/* 右のスペーサー */}
        </div>
      )}
    </div>
  );
};

export default function SeatShuffleApp() {
  const [rows, setRows] = useState(7);
  const [cols, setCols] = useState(6);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [stoppingIndex, setStoppingIndex] = useState<number | null>(null);
  const finalResultsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    setDesks(prev => {
      const newDesks = [...prev.filter(d => d.row < rows && d.col < cols)];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!newDesks.find(d => d.row === r && d.col === c)) {
            newDesks.push({ id: `desk-${r}-${c}-${Math.random().toString(36).substring(2, 9)}`, row: r, col: c, studentName: '', isFixed: false, isExcluded: false });
          }
        }
      }
      return newDesks.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
    });
  }, [rows, cols]);

  const updateDesk = (id: string, updates: Partial<Desk>) => {
    setDesks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const students = useMemo(() => desks.filter(d => d.studentName.trim() !== '').map(d => d.studentName), [desks]);
  const activeDeskCount = useMemo(() => desks.filter(d => !d.isExcluded).length, [desks]);

  const startShuffle = () => {
    if (students.length !== activeDeskCount) {
      alert(`席数と人数が一致しません。\n現在：有効な席 ${activeDeskCount}席 / 名前入力済 ${students.length}名`);
      return;
    }
    playSound('slot_start.mp3');
    setIsShuffling(true);
    setStoppingIndex(0);
    const active = desks.filter(d => !d.isExcluded);
    const fixedNames = active.filter(d => d.isFixed && d.studentName).map(d => d.studentName);
    const availableNames = students.filter(n => !fixedNames.includes(n)).sort(() => Math.random() - 0.5);
    const results: Record<string, string> = {};
    let nameIdx = 0;
    desks.forEach(d => {
      if (d.isExcluded) return;
      if (d.isFixed && d.studentName) results[d.id] = d.studentName;
      else { results[d.id] = availableNames[nameIdx] || ""; nameIdx++; }
    });
    finalResultsRef.current = results;
  };

  const stopNext = () => {
    playSound('slot_stop.mp3');
    let nextIdx = (stoppingIndex === null ? 0 : stoppingIndex + 1);
    while (nextIdx < desks.length && (desks[nextIdx].isExcluded || desks[nextIdx].isFixed)) nextIdx++;
    if (nextIdx >= desks.length) {
      setIsShuffling(false);
      setStoppingIndex(null);
      playSound('slot_finish.mp3');
    } else {
      setStoppingIndex(nextIdx);
    }
  };

  const forceStop = () => {
    setIsShuffling(false);
    setStoppingIndex(null);
    playSound('slot_finish.mp3');
  };

  const handleExport = () => {
    const data = JSON.stringify({ rows, cols, desks });
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'seats.json'; a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = (ev) => {
      try { const json = JSON.parse(ev.target?.result as string); setRows(json.rows); setCols(json.cols); setDesks(json.desks); } 
      catch { alert("失敗"); }
    }; reader.readAsText(file);
  };

  return (
    <div className="App">
      <style>{`
        @keyframes reel-move { 0% { transform: translateY(-480px); } 100% { transform: translateY(0px); } }
        .reel-animation { animation: reel-move 0.8s linear infinite; }
      `}</style>

      <div className="tool_head">
        <a className="back_home" href="/"><img className="back_home_img" src="/img/esc.png" alt="戻る"/>ホームへ戻る</a>
        <h1 className="tool_title">席替えスロットル</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#444', marginBottom: '15px', fontWeight: 'bold' }}>1. 配置設定</h2>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', border: '3px solid black', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}><Download size={18}/> 設定を保存</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', border: '3px solid black', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              <Upload size={18}/> 設定を読込<input type="file" style={{ display: 'none' }} onChange={handleImport} accept=".json" />
            </label>
          </div>
          <DeskGrid isResult={false} rows={rows} cols={cols} desks={desks} isShuffling={false} stoppingIndex={null} allNames={students} finalResults={{}} onUpdateDesk={updateDesk} onSetRows={setRows} onSetCols={setCols} />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#444', marginBottom: '10px', fontWeight: 'bold' }}>2. スロット結果</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            <button onClick={startShuffle} disabled={isShuffling} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 40px', borderRadius: '4px', border: '3px solid #000', backgroundColor: isShuffling ? '#ccc' : '#1C8C42', color: '#fff', fontWeight: 'bold', fontSize: '20px', cursor: isShuffling ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              <Play size={24}/> スロット開始
            </button>
            <button onClick={stopNext} disabled={!isShuffling} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '4px', border: '3px solid #000', backgroundColor: !isShuffling ? '#eee' : '#1C8C42', color: !isShuffling ? '#999' : '#fff', fontWeight: 'bold', fontSize: '16px', cursor: !isShuffling ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              <SkipForward size={20}/> 次を止める
            </button>
            <button onClick={forceStop} disabled={!isShuffling} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '4px', border: '3px solid #000', backgroundColor: !isShuffling ? '#eee' : '#f97316', color: !isShuffling ? '#999' : '#fff', fontWeight: 'bold', fontSize: '16px', cursor: !isShuffling ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              <Square size={20}/> 一括停止
            </button>
          </div>

          <DeskGrid isResult={true} rows={rows} cols={cols} desks={desks} isShuffling={isShuffling} stoppingIndex={stoppingIndex} allNames={students} finalResults={finalResultsRef.current} onUpdateDesk={updateDesk} onSetRows={setRows} onSetCols={setCols} />
        </section>
      </div>
    </div>
  );
}