import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lock, Unlock, Download, Play, Square, SkipForward, X, Upload } from 'lucide-react';
import './App.css';

// --- 型定義 ---
interface Desk {
  id: string;
  row: number;
  col: number;
  studentName: string;
  isFixed: boolean;
  isExcluded: boolean;
}

// --- 定数設定 ---
const SEAT_W = 120;
const SEAT_H = 80;
const GAP = 5;
const SIDE_BTN_W = 50;

// --- サウンド再生ヘルパー ---
const playSound = (fileName: string) => {
  const audio = new Audio(`/sounds/${fileName}`);
  audio.play().catch(e => console.log("Audio play blocked or file not found", e));
};

// --- 共通コンポーネント: 座席グリッド ---
const DeskGrid = ({ 
  isResult = false, 
  rows, 
  cols, 
  desks, 
  isShuffling, 
  stoppingIndex, 
  shufflingNames, 
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
  shufflingNames: Record<string, string>;
  finalResults: Record<string, string>;
  onUpdateDesk: (id: string, updates: Partial<Desk>) => void;
  onSetRows: (val: number) => void;
  onSetCols: (val: number) => void;
  children?: React.ReactNode;
}) => {
  return (
    <div style={{ 
      display: 'inline-flex', 
      flexDirection: 'column', 
      alignItems: 'center', // 常に全体を中央揃え
      background: isResult ? '#f0f7ff' : 'transparent', 
      padding: '30px', 
      borderRadius: '12px', 
      border: isResult ? '3px dashed #2563eb' : 'none',
      minWidth: isResult ? '600px' : 'auto' // ボタンで枠が広がりすぎても崩れないように
    }}>
      {/* 教卓 */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '20px' }}>
        <div style={{ width: '160px', height: '60px', backgroundColor: 'white', border: '3px solid black', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
          教 卓
        </div>
      </div>

      {/* シャッフルボタン（結果用のみ：教卓の下に配置） */}
      {children && <div style={{ marginBottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' }}>{children}</div>}

      {/* 列削除ボタン (入力モードのみ) */}
      {!isResult && (
        <div style={{ display: 'flex', gap: `${GAP}px`, marginBottom: `${GAP}px` }}>
          <div style={{ width: `${SIDE_BTN_W + GAP}px` }} /> {/* 左の行削除ボタン分を空ける */}
          {[...Array(cols)].map((_, c) => (
            <button key={`col-del-${c}`} onClick={() => onSetCols(Math.max(1, cols - 1))} style={{ width: `${SEAT_W}px`, height: '30px', backgroundColor: '#ff4b4b', color: '#fff', border: '2px solid #9b0000', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>列削除</button>
          ))}
          <div style={{ width: `${SIDE_BTN_W + GAP}px` }} /> {/* 右の列追加ボタン分を空けて中央維持 */}
        </div>
      )}

      {/* メイン座席エリア */}
      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
          {[...Array(rows)].map((_, r) => (
            <div key={`row-${r}`} style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
              
              {!isResult && (
                <button onClick={() => onSetRows(Math.max(1, rows - 1))} style={{ width: `${SIDE_BTN_W}px`, height: `${SEAT_H}px`, backgroundColor: '#ff4b4b', color: '#fff', border: '2px solid #9b0000', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>行削除</button>
              )}

              {[...Array(cols)].map((_, c) => {
                const desk = desks.find(d => d.row === r && d.col === c);
                if (!desk) return null;

                const isStopping = isShuffling && stoppingIndex !== null && desks.indexOf(desk) < stoppingIndex;
                const displayVal = isShuffling 
                  ? (isStopping || desk.isFixed ? (finalResults[desk.id] || "") : shufflingNames[desk.id]) 
                  : (isResult ? (finalResults[desk.id] || "") : desk.studentName);

                return (
                  <div key={desk.id} style={{ position: 'relative', width: `${SEAT_W}px`, height: `${SEAT_H}px`, border: '2px solid #333', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: desk.isExcluded ? '#1a1a1a' : '#fff', boxSizing: 'border-box' }}>
                    {!desk.isExcluded && (
                      <>
                        {isResult ? (
                          <span style={{ fontSize: '20px', fontWeight: '900', color: desk.isFixed ? '#d97706' : '#000' }}>{displayVal}</span>
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

              {/* 入力モード時、右側に透明なスペーサーを置いて座席を中央に保つ */}
              {!isResult && <div style={{ width: `${SIDE_BTN_W}px` }} />}
            </div>
          ))}
        </div>

        {!isResult && (
          <button onClick={() => onSetCols(cols + 1)} style={{ width: `${SIDE_BTN_W}px`, height: `${rows * SEAT_H + (rows - 1) * GAP}px`, backgroundColor: '#2e7d32', color: '#fff', border: '2px solid #1b5e20', borderRadius: '4px', fontWeight: 'bold', writingMode: 'vertical-rl', cursor: 'pointer' }}>列追加</button>
        )}
      </div>

      {!isResult && (
        <div style={{ display: 'flex', marginTop: `${GAP}px` }}>
          <div style={{ width: `${SIDE_BTN_W + GAP}px` }} />
          <button onClick={() => onSetRows(rows + 1)} style={{ width: `${cols * SEAT_W + (cols - 1) * GAP}px`, height: '50px', backgroundColor: '#2e7d32', color: '#fff', border: '2px solid #1b5e20', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>行追加</button>
          <div style={{ width: `${SIDE_BTN_W + GAP}px` }} />
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
  const [shufflingNames, setShufflingNames] = useState<Record<string, string>>({});
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

  // シャッフル開始
  const startShuffle = () => {
    if (students.length === 0) return alert("名前を入力してください。");
    
    playSound('slot_start.mp3'); // Sound!

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isShuffling) {
      interval = setInterval(() => {
        const nextShuffling: Record<string, string> = {};
        desks.forEach((d, idx) => {
          if (!d.isExcluded && !d.isFixed && (stoppingIndex === null || idx >= stoppingIndex)) {
            nextShuffling[d.id] = students[Math.floor(Math.random() * students.length)] || "???";
          }
        });
        setShufflingNames(nextShuffling);
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isShuffling, stoppingIndex, desks, students]);

  // 次を止める
  const stopNext = () => {
    playSound('slot_stop.mp3'); // Sound!

    let nextIdx = (stoppingIndex === null ? 0 : stoppingIndex + 1);
    while (nextIdx < desks.length && (desks[nextIdx].isExcluded || desks[nextIdx].isFixed)) nextIdx++;
    
    if (nextIdx >= desks.length) {
        setIsShuffling(false);
        setStoppingIndex(null);
        playSound('slot_finish.mp3'); // Finish Sound!
    } else {
        setStoppingIndex(nextIdx);
    }
  };

  // 一括停止
  const forceStop = () => {
    setIsShuffling(false);
    setStoppingIndex(null);
    playSound('slot_finish.mp3'); // Finish Sound!
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
      <div className="tool_head">
        <a className="back_home" href="/"><img className="back_home_img" src="/img/esc.png" alt="戻る"/>ホームへ戻る</a>
        <h1 className="tool_title">席替えスロットル</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
        
        {/* 1. 設定セクション */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#444', marginBottom: '15px', fontWeight: 'bold' }}>1. メンバー入力・配置設定</h2>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <button onClick={() => {
              const data = JSON.stringify({ rows, cols, desks });
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'seats.json'; a.click();
            }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '2px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              <Download size={18}/> 設定を保存
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '2px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              <Upload size={18}/> 設定を読込
              <input type="file" style={{ display: 'none' }} onChange={importData} accept=".json" />
            </label>
          </div>

          <DeskGrid 
            isResult={false} rows={rows} cols={cols} desks={desks} 
            isShuffling={false} stoppingIndex={null} 
            shufflingNames={{}} finalResults={{}}
            onUpdateDesk={updateDesk} onSetRows={setRows} onSetCols={setCols}
          />
        </section>

        {/* 2. 結果セクション */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#2563eb', marginBottom: '20px', fontWeight: 'bold' }}>2. シャッフル結果</h2>
          
          <DeskGrid 
            isResult={true} rows={rows} cols={cols} desks={desks} 
            isShuffling={isShuffling} stoppingIndex={stoppingIndex} 
            shufflingNames={shufflingNames} finalResults={finalResultsRef.current}
            onUpdateDesk={updateDesk} onSetRows={setRows} onSetCols={setCols}
          >
            {/* シャッフル操作ボタン (枠の中・教卓の下) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button 
                onClick={startShuffle} 
                disabled={isShuffling}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 40px', borderRadius: '35px', border: 'none', 
                  backgroundColor: isShuffling ? '#cbd5e1' : '#2563eb', 
                  color: isShuffling ? '#94a3b8' : '#fff', fontWeight: 'bold', fontSize: '20px', cursor: isShuffling ? 'not-allowed' : 'pointer',
                  boxShadow: isShuffling ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Play size={24}/> シャッフル開始
              </button>

              <button 
                onClick={stopNext} 
                disabled={!isShuffling}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '35px', border: 'none', 
                  backgroundColor: !isShuffling ? '#f1f5f9' : '#f97316', 
                  color: !isShuffling ? '#cbd5e1' : '#fff', fontWeight: 'bold', fontSize: '16px', cursor: !isShuffling ? 'not-allowed' : 'pointer'
                }}
              >
                <SkipForward size={20}/> 次を止める
              </button>

              <button 
                onClick={forceStop} 
                disabled={!isShuffling}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '35px', border: 'none', 
                  backgroundColor: !isShuffling ? '#f1f5f9' : '#ef4444', 
                  color: !isShuffling ? '#cbd5e1' : '#fff', fontWeight: 'bold', fontSize: '16px', cursor: !isShuffling ? 'not-allowed' : 'pointer'
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