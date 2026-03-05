import React from 'react';
import './App.css';

interface DeskState {
  [key: string]: {
    isToggled: boolean;
    isDarkened: boolean;
  };
}

function App() {
  // 席の初期設定
  const [rows, setRows] = React.useState(7);
  const [cols, setCols] = React.useState(6);
  const [deskStates, setDeskStates] = React.useState<DeskState>({});
  
  const seatingChart = React.useMemo(() => {
    return [...Array(rows)].map(() => Array(cols).fill("机"));
  }, [rows, cols]);

  // 名前リスト管理の状態
  const [names, setNames] = React.useState<string[]>([]);
  const [newName, setNewName] = React.useState("");
  const [selectedNames, setSelectedNames] = React.useState<Set<number>>(new Set());

  // 有効な席の数を計算する関数
  const calculateValidSeats = React.useCallback(() => {
    let validCount = 0;
    Object.keys(deskStates).forEach(key => {
      if (!deskStates[key].isDarkened) {
        validCount++;
      }
    });
    return validCount;
  }, [deskStates]);

  // メンバー数が有効座席数と一致しているか判定するメソッド
  const isValidSeatAssignment = React.useCallback(() => {
    const validSeats = calculateValidSeats();
    return names.length === validSeats;
  }, [names.length, calculateValidSeats]);

  // 行を削除する関数
  const deleteRow = (rowIndex: number) => {
    if (rows <= 1) {
      alert("座席の最低有効数は1x1です。これ以上行を削除できません。");
      return;
    }
    setRows(prev => prev - 1);
  };

  // 列を削除する関数
  const deleteCol = (colIndex: number) => {
    if (cols <= 1) {
      alert("座席の最低有効数は1x1です。これ以上列を削除できません。");
      return;
    }
    setCols(prev => prev - 1);
  };

  // デスクの状態を初期化する
  React.useEffect(() => {
    const initialStates: DeskState = {};
    seatingChart.forEach((row, rowIndex) => {
      row.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        if (!initialStates[key]) {
          initialStates[key] = { isToggled: false, isDarkened: false };
        }
      });
    });
    setDeskStates(initialStates);
  }, [seatingChart]);

  // 右上トグルスイッチのクリックハンドラ
  const handleToggleClick = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${rowIndex}-${colIndex}`;
    setDeskStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isToggled: !prev[key].isToggled
      }
    }));
  };

  // 名前リスト関連ハンドラ
  const addName = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      setNames(prev => [...prev, trimmed]);
      setNewName("");
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedNames(prev => {
      const copy = new Set(prev);
      if (copy.has(index)) {
        copy.delete(index);
      } else {
        copy.add(index);
      }
      return copy;
    });
  };

  const deleteSelected = () => {
    setNames(prev => prev.filter((_, i) => !selectedNames.has(i)));
    setSelectedNames(new Set());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const imported = text
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      if (imported.length) {
        setNames(prev => [...prev, ...imported]);
      }
    };
    reader.readAsText(file);
    // リセットして同じファイルを再度選択できるようにする
    e.target.value = "";
  };

  // ボックス全体のクリックハンドラ（右上トグルスイッチ以外の部分）
  const handleBoxClick = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const currentState = deskStates[key] || { isToggled: false, isDarkened: false };
    
    // ブラックアウトしようとする場合（isDarkenedがfalseからtrueになる場合）
    if (!currentState.isDarkened) {
      const validSeats = calculateValidSeats();
      if (validSeats <= 1) {
        alert("座席の最低有効数は1x1です。これ以上座席を無効化できません。");
        return;
      }
    }
    
    setDeskStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isDarkened: !prev[key].isDarkened
      }
    }));
  };

  return (
    <div className="App">
      <div className="tool_head">
        <a className="back_home" href="/">
          <img className="back_home_img" src="/img/esc.png" alt="戻る"/>
          ホームへ戻る
        </a>
        <h1 className="tool_title">席替えスロットル</h1>
      </div>
      
      {/* 有効座席数表示 */}
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
        有効座席数: {calculateValidSeats()} 席
      </div>

      <div className="table_area">
        <div className="table_rows">
          {/* 教卓を最前列の上に描画 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div 
              style={{
                width: '120px',
                height: '60px',
                backgroundColor: 'white',
                border: '2px solid black',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'black',
              }}
            >
              教 卓
            </div>
          </div>

          {/* 列削除ボタンの行 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
            {/* 行削除ボタンのスペース */}
            <div style={{ width: '50px', flexShrink: 0 }}></div>
            {/* 列削除ボタン */}
            {[...Array(cols)].map((_, colIndex) => (
              <button
                key={`col-delete-${colIndex}`}
                onClick={() => deleteCol(colIndex)}
                style={{
                  width: '90px',
                  height: '30px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: '2px solid #c92a2a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '9px',
                  padding: '0px',
                  textAlign: 'center',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="列を削除"
              >
                列削除
              </button>
            ))}
          </div>

          {seatingChart.map((row, rowIndex) => (
            /* 行ごとのコンテナ */
            <div key={rowIndex} className="desk_row" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              {/* 行削除ボタン */}
              <button
                onClick={() => deleteRow(rowIndex)}
                style={{
                  width: '50px',
                  height: '60px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: '2px solid #c92a2a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  padding: '4px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`${rowIndex + 1}行目を削除`}
              >
                行削除
              </button>

              {/* 座席の列 */}
              {row.map((desk, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const state = deskStates[key] || { isToggled: false, isDarkened: false };
                const boxSize = 90;
                const deskHeight = 60;
                const toggleSize = 24;

                return (
                  <div 
                    key={key}
                    className="desk"
                    onClick={() => handleBoxClick(rowIndex, colIndex)}
                    style={{
                      position: 'relative',
                      width: `${boxSize}px`,
                      height: `${deskHeight}px`,
                      border: '2px solid #333',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      backgroundColor: state.isDarkened ? '#333333' : 'white',
                      color: state.isDarkened ? 'white' : 'black',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      userSelect: 'none'
                    }}
                  >
                    {/* ブラックアウト時は席番号を表示しない */}
                    {!state.isDarkened && `${rowIndex + 1}-${colIndex + 1}`}

                    <div
                      onClick={(e) => handleToggleClick(rowIndex, colIndex, e)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: `${toggleSize}px`,
                        height: `${toggleSize}px`,
                        backgroundColor: state.isToggled ? '#FFD700' : '#CCCCCC',
                        border: '2px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="席固定"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 名前リストエリア（メンバー一覧） */}
      <div className="name-list-area">
        <h2>メンバー一覧</h2>
        <div className="add-name">
          <div className="add-name-row">
            <input
              type="text"
              className="member-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="名前を入力"
              aria-label="メンバー名"
            />
            <button onClick={addName}>追加</button>
          </div>
          <label className="member-file-label">テキストファイルでメンバー読み込み
            <input
              type="file"
              className="member-file"
              accept=".txt"
              onChange={handleFileUpload}
              aria-label="メンバー一覧ファイル"
            />
          </label>
        </div>
        <ul className="name-list">
          {names.map((name, index) => (
            <li key={index} className="member-item">
              <div className="member-left">
                <span className="member-index">{index + 1}.</span>
                <span>{name}</span>
              </div>
              <input
                type="checkbox"
                checked={selectedNames.has(index)}
                onChange={() => toggleSelect(index)}
                aria-label={`選択 ${name}`}
              />
            </li>
          ))}
        </ul>
        <button onClick={deleteSelected} disabled={selectedNames.size === 0} className="delete-button">
          選択を削除
        </button>
      </div>
    </div>
  );
}

export default App;
