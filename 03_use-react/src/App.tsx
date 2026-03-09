import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lock, Unlock, Download, Play, Square, SkipForward, X, Upload } from 'lucide-react';
import './App.css';

// --- 設定値 ---
const SEAT_W = 120;
const SEAT_H = 80;
const GAP = 5;
const SIDE_BTN_W = 50;

// --- サウンド再生ヘルパー ---
const playSound = (fileName: string) => {
  // public/sounds/ フォルダ内のファイルを参照
  const audio = new Audio(`/sounds/${fileName}`);
  audio.play().catch(e => console.log("Audio play blocked", e));
};

// --- 型定義 ---
interface Desk {
  id: string;
  row: number;
  col: number;
  studentName: string;
  isFixed: boolean;
  isExcluded: boolean;
}

// --- スロットリールコンポーネント ---
const SlotReel = ({ names, isSpinning, finalName }: { names: string[], isSpinning: boolean, finalName: string }) => {
  if (!isSpinning) {
    return <span style={{ fontSize: '20px', fontWeight: '900' }}>{finalName}</span>;
  }

  // スロット感を出すためのダミー名のリスト
  const reelNames = [...names, ...names].slice(0, 10);

  return (
    <div style={{ height: '30px', overflow: 'hidden', position: 'relative' }}>
      <div className="reel-animation" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {reelNames.map((name, i) => (
          <div key={i} style={{ height: '30px', lineHeight: '30px', fontSize: '18px', fontWeight: 'bold', color: '#666' }}>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 共通コンポーネント: 座席グリッド ---
const DeskGrid = ({ 
  isResult = false, 
  rows, 
  cols, 
  desks, 
  isShuffling, 
  stoppingIndex, 
  allNames,
  finalResults,
  onUpdateDesk,
  onSetRows,
  onSetCols,
  children 
}: { 
  isResult: boolean;
  rows: number;
  cols: number;
  desks: Desk[];
  isShuffling: boolean;
  stoppingIndex: number | null;
  allNames: string[];
  finalResults: Record<string, string>;
  onUpdateDesk: (id: string, updates: Partial<Desk>) => void;
  onSetRows: (val: number) => void;
  onSetCols: (val: number) => void;
  children?: React.ReactNode;
}) => {
  const spacerW = SIDE_BTN_W + GAP;

  return (
    <div style={{ 
      display: 'inline-flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      background: isResult ? '#f0f7ff' : 'transparent', 
      padding: '30px', 
      borderRadius: '8px', 
      border: isResult ? '4px solid #2563eb' : 'none',
      minWidth: 'fit-content'
    }}>
      {/* 教卓 */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '20px' }}>
        <div style={{ width: '160px', height: '60px', backgroundColor: 'white', border: '3px solid black', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
          教 卓
        </div>
      </div>

      {children && <div style={{ marginBottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' }}>{children}</div>}

      {/* 列削除ボタン */}
      {!isResult && (
        <div style={{ display: 'flex', gap: `${GAP}px`, marginBottom: `${GAP}px`, width: '100%', justifyContent: 'center' }}>
          <div style={{ width: `${spacerW}px` }} />
          {[...Array(cols)].map((_, c) => (
            <button key={`col-del-${c}`} onClick={() => onSetCols(Math.max(1, cols - 1))} style={{ width: `${SEAT_W}px`, height: '30px', backgroundColor: '#ff4b4b', color: '#fff', border: '2px solid #9b0000', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>列削除</button>
          ))}
          <div style={{ width: `${spacerW}px` }} />
        </div>
      )}

      {/* メイン座席エリア */}
      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
          {[...Array(rows)].map((_, r) => (
            <div key={`row-${r}`} style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
              {!isResult && (
                <button onClick={() => onSetRows(Math.max(1, rows - 1))} style={{ width: `${SIDE_BTN_W}px`, height: `${SEAT_H}px`, backgroundColor: '#ff4b4b', color: '#fff', border: '2px solid #9b0000', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>行削除</button>
              )}

              {[...Array(cols)].map((_, c) => {
                const desk = desks.find(d => d.row === r && d.col === c);
                if (!desk) return null;

                const deskIndex = desks.indexOf(desk);
                const isSpinning = isShuffling && (stoppingIndex === null || deskIndex >= stoppingIndex) && !desk.isExcluded && !desk.isFixed;
                const isStoppedAlready = isShuffling && stoppingIndex !== null && deskIndex < stoppingIndex;

                return (
                  <div key={desk.id} style={{ 
                    position: 'relative', width: `${SEAT_W}px`, height: `${SEAT_H}px`, 
                    border: (isShuffling && stoppingIndex === deskIndex) ? '4px solid #f97316' : '2px solid #333', 
                    borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    backgroundColor: desk.isExcluded ? '#1a1a1a' : '#fff', boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    {!desk.isExcluded && (
                      <>
                        {isResult ? (
                          <div style={{ textAlign: 'center' }}>
                            <SlotReel 
                              names={allNames} 
                              isSpinning={isSpinning} 
                              finalName={(isStoppedAlready || !isShuffling) ? (finalResults[desk.id] || "") : ""} 
                            />
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={desk.studentName}
                              onChange={(e) => onUpdateDesk(desk.id, { studentName: e.target.value })}
                              placeholder={`${r + 1}-${c + 1}`}
                              style={{ width: '90%', border: 'none', textAlign: 'center', fontSize: '16px', outline: 'none', background: 'transparent', fontWeight: 'bold' }}
                            />
                            <div onClick={() => onUpdateDesk(desk.id, { isFixed: !desk.isFixed })} style={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer', color: desk.isFixed ? '#d97706' : '#999' }}>
                              {desk.isFixed ? <Lock size={18} strokeWidth={3} /> : <Unlock size={16} />}
                            </div>
                            <div onClick={() => onUpdateDesk(desk.id, { isExcluded: true })} style={{ position: 'absolute', bottom: '4px', right: '4px', cursor: 'pointer', color: '#999' }}>
                              <X size={16} strokeWidth={3} />
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {!isResult && desk.isExcluded && (
                      <div onClick={() => onUpdateDesk(desk.id, { isExcluded: false })} style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>復活</div>
                    )}
                  </div>
                );
              })}
              {!isResult && <div style={{ width: '0px' }} />}
            </div>
          ))}
        </div>

        {!isResult && (
          <button onClick={() => onSetCols(cols + 1)} style={{ width: `${SIDE_BTN_W}px`, height: `${rows * SEAT_H + (rows - 1) * GAP}px`, backgroundColor: '#2e7d32', color: '#fff', border: '2px solid #1b5e20', borderRadius: '4px', fontWeight: 'bold', writingMode: 'vertical-rl', cursor: 'pointer' }}>列追加</button>
        )}
      </div>

      {!isResult && (
        <div style={{ display: 'flex', marginTop: `${GAP}px`, width: '100%', justifyContent: 'center' }}>
          <div style={{ width: `${spacerW}px` }} />
          <button onClick={() => onSetRows(rows + 1)} style={{ width: `${cols * SEAT_W + (cols - 1) * GAP}px`, height: '50px', backgroundColor: '#2e7d32', color: '#fff', border: '2px solid #1b5e20', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>行追加</button>
          <div style={{ width: `${spacerW}px` }} />
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

  const updateDesk = (id: string, updates: Partial<Desk>) => {
    setDesks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const students = useMemo(() => desks.filter(d => d.studentName.trim() !== '').map(d => d.studentName), [desks]);

  const startShuffle = () => {
    if (students.length === 0) return alert("名前を入力してください。");
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
    
    // スキップ対象（除外・固定）を飛ばす
    while (nextIdx < desks.length && (desks[nextIdx].isExcluded || desks[nextIdx].isFixed)) {
      nextIdx++;
    }
    
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

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        setRows(json.rows); setCols(json.cols); setDesks(json.desks);
      } catch { alert("読み込みに失敗しました"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="App">
      {/* CSS追加 (リール回転用) */}
      <style>{`
        @keyframes reel-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(-150px); }
        }
        .reel-animation {
          animation: reel-move 0.2s linear infinite;
        }
      `}</style>

      <div className="tool_head">
        <a className="back_home" href="/"><img className="back_home_img" src="/img/esc.png" alt="戻る"/>ホームへ戻る</a>
        <h1 className="tool_title">席替えスロットル</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
        
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#444', marginBottom: '15px', fontWeight: 'bold' }}>1. 配置設定</h2>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <button onClick={() => {
              const data = JSON.stringify({ rows, cols, desks });
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'seats.json'; a.click();
            }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', border: '2px solid #333', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              <Download size={18}/> 保存
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', border: '2px solid #333', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              <Upload size={18}/> 読込
              <input type="file" style={{ display: 'none' }} onChange={importData} accept=".json" />
            </label>
          </div>

          <DeskGrid 
            isResult={false} rows={rows} cols={cols} desks={desks} 
            isShuffling={false} stoppingIndex={null} 
            allNames={students} finalResults={{}}
            onUpdateDesk={updateDesk} onSetRows={setRows} onSetCols={setCols}
          />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#2563eb', marginBottom: '20px', fontWeight: 'bold' }}>2. シャッフル結果</h2>
          
          <DeskGrid 
            isResult={true} rows={rows} cols={cols} desks={desks} 
            isShuffling={isShuffling} stoppingIndex={stoppingIndex} 
            allNames={students} finalResults={finalResultsRef.current}
            onUpdateDesk={updateDesk} onSetRows={setRows} onSetCols={setCols}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button 
                onClick={startShuffle} 
                disabled={isShuffling}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 40px', borderRadius: '4px', 
                  border: '3px solid #000', backgroundColor: isShuffling ? '#ccc' : '#2563eb', 
                  color: '#fff', fontWeight: 'bold', fontSize: '20px', cursor: isShuffling ? 'not-allowed' : 'pointer'
                }}
              >
                <Play size={24}/> シャッフル開始
              </button>

              <button 
                onClick={stopNext} 
                disabled={!isShuffling}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '4px', 
                  border: '3px solid #000', backgroundColor: !isShuffling ? '#eee' : '#f97316', 
                  color: !isShuffling ? '#999' : '#fff', fontWeight: 'bold', fontSize: '16px', cursor: !isShuffling ? 'not-allowed' : 'pointer'
                }}
              >
                <SkipForward size={20}/> 次を止める
              </button>

              <button 
                onClick={forceStop} 
                disabled={!isShuffling}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '4px', 
                  border: '3px solid #000', backgroundColor: !isShuffling ? '#eee' : '#ef4444', 
                  color: !isShuffling ? '#999' : '#fff', fontWeight: 'bold', fontSize: '16px', cursor: !isShuffling ? 'not-allowed' : 'pointer'
                }}
              >
                <Square size={20}/> 一括停止
              </button>
            </div>
          </DeskGrid>
        </section>
      </div>
    </div>
  );
}