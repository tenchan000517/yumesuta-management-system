'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Table, FileSpreadsheet, Download, Search, Plus, Columns, Trash2 } from 'lucide-react';

interface SheetInfo {
  title: string;
  sheetId: number;
  index: number;
  rowCount: number;
  columnCount: number;
}

interface SheetData {
  sheetName: string;
  sheetId: number;
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export default function YumeMagaSheetsPage() {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowLimit, setRowLimit] = useState(100);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowValues, setNewRowValues] = useState<string[]>([]);

  // シート一覧を取得
  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/yumemaga-sheets');
      const json = await res.json();
      if (json.success) {
        setSheets(json.data.sheets);
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  // 特定シートのデータを取得
  const fetchSheetData = async (sheetName: string, providedSheetId?: number) => {
    setLoading(true);
    setSelectedSheet(sheetName);

    try {
      const res = await fetch(`/api/yumemaga-sheets?sheet=${encodeURIComponent(sheetName)}&limit=${rowLimit}`);
      const json = await res.json();

      if (json.success) {
        // sheetIdを取得（パラメータ優先、なければsheetsから検索）
        let sheetId = providedSheetId;
        if (sheetId === undefined) {
          const sheet = sheets.find(s => s.title === sheetName);
          sheetId = sheet?.sheetId;
        }

        setSheetData({ ...json.data, sheetId: sheetId });
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // CSVダウンロード
  const downloadCSV = () => {
    if (!sheetData) return;

    const csvContent = sheetData.rows
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sheetData.sheetName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // セル編集を開始
  const startEdit = (row: number, col: number, currentValue: any) => {
    setEditingCell({ row, col });
    setEditValue(String(currentValue || ''));
  };

  // セル編集を保存
  const saveEdit = async () => {
    if (!editingCell || !sheetData) return;

    try {
      const res = await fetch('/api/yumemaga-sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: sheetData.sheetName,
          row: editingCell.row + 1, // 1-indexed
          col: editingCell.col + 1, // 1-indexed
          value: editValue,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // ローカルデータを更新
        const newRows = [...sheetData.rows];
        newRows[editingCell.row][editingCell.col] = editValue;
        setSheetData({ ...sheetData, rows: newRows });
        setEditingCell(null);
        setEditValue('');
      } else {
        alert(`エラー: ${json.error}`);
      }
    } catch (error) {
      console.error('Error saving cell:', error);
      alert('セルの保存に失敗しました');
    }
  };

  // セル編集をキャンセル
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // 行追加を開始
  const startAddRow = () => {
    if (!sheetData) return;
    setNewRowValues(new Array(sheetData.columnCount).fill(''));
    setShowAddRow(true);
  };

  // 行追加を保存
  const saveNewRow = async () => {
    if (!sheetData) return;

    try {
      const res = await fetch('/api/yumemaga-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'appendRows',
          sheetName: sheetData.sheetName,
          rows: [newRowValues],
        }),
      });

      const json = await res.json();
      if (json.success) {
        // データを再取得
        await fetchSheetData(sheetData.sheetName);
        setShowAddRow(false);
        setNewRowValues([]);
      } else {
        alert(`エラー: ${json.error}`);
      }
    } catch (error) {
      console.error('Error adding row:', error);
      alert('行の追加に失敗しました');
    }
  };

  // 行追加をキャンセル
  const cancelAddRow = () => {
    setShowAddRow(false);
    setNewRowValues([]);
  };

  // 列を追加
  const addColumn = async () => {
    if (!sheetData) return;

    if (sheetData.sheetId === undefined) {
      alert('シートIDが取得できていません。シートを再読み込みしてください。');
      return;
    }

    const colIndex = prompt(`列を挿入する位置を入力してください (0 = 最初, ${sheetData.columnCount} = 最後):`);
    if (colIndex === null) return;

    const index = parseInt(colIndex);
    if (isNaN(index) || index < 0) {
      alert('有効な数値を入力してください');
      return;
    }

    try {
      const res = await fetch('/api/yumemaga-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insertColumns',
          sheetId: sheetData.sheetId,
          startIndex: index,
          count: 1,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchSheetData(sheetData.sheetName);
      } else {
        alert(`エラー: ${json.error}`);
      }
    } catch (error) {
      console.error('Error adding column:', error);
      alert('列の追加に失敗しました');
    }
  };

  // 列を削除
  const deleteColumn = async () => {
    if (!sheetData) return;

    const colIndex = prompt(`削除する列の位置を入力してください (0-${sheetData.columnCount - 1}):`);
    if (colIndex === null) return;

    const index = parseInt(colIndex);
    if (isNaN(index) || index < 0 || index >= sheetData.columnCount) {
      alert('有効な数値を入力してください');
      return;
    }

    if (!confirm(`列 ${String.fromCharCode(65 + index)} を削除しますか？`)) return;

    try {
      const res = await fetch('/api/yumemaga-sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'columns',
          sheetId: sheetData.sheetId,
          startIndex: index,
          count: 1,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchSheetData(sheetData.sheetName);
      } else {
        alert(`エラー: ${json.error}`);
      }
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('列の削除に失敗しました');
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const filteredSheets = sheets.filter((sheet) =>
    sheet.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            トップページへ戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">ゆめマガシート管理</h1>
          <p className="text-gray-600 mt-1">スプレッドシートの全シートを確認・操作</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* シート一覧 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">シート一覧</h2>
              <span className="text-sm text-gray-600">({sheets.length}件)</span>
            </div>
            <button
              onClick={fetchSheets}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>

          {/* 検索 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="シート名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* シート一覧テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">シート名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">行数</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">列数</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSheets.map((sheet) => (
                  <tr
                    key={sheet.sheetId}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedSheet === sheet.title ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">{sheet.index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sheet.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sheet.rowCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sheet.columnCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchSheetData(sheet.title, sheet.sheetId)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Table className="w-4 h-4" />
                        表示
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* シートデータ表示 */}
        {sheetData && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Table className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">{sheetData.sheetName}</h2>
                <span className="text-sm text-gray-600">
                  ({sheetData.rowCount}行 × {sheetData.columnCount}列)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={rowLimit}
                  onChange={(e) => setRowLimit(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50行</option>
                  <option value={100}>100行</option>
                  <option value={200}>200行</option>
                  <option value={500}>500行</option>
                </select>
                <button
                  onClick={startAddRow}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  行追加
                </button>
                <button
                  onClick={addColumn}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Columns className="w-4 h-4" />
                  列追加
                </button>
                <button
                  onClick={deleteColumn}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  列削除
                </button>
                <button
                  onClick={() => fetchSheetData(selectedSheet!)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  再読込
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>

            {/* データテーブル */}
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">
                      行
                    </th>
                    {sheetData.rows[0]?.map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"
                      >
                        {String.fromCharCode(65 + colIndex)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sheetData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}>
                      <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-300 bg-gray-50">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => {
                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                        return (
                          <td
                            key={colIndex}
                            className="px-2 py-2 text-xs text-gray-900 border-r border-gray-300 max-w-xs"
                            title={String(cell || '')}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="w-full px-1 py-0.5 border border-blue-500 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={saveEdit}
                                  className="px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                                  title="保存 (Enter)"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-1 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
                                  title="キャンセル (Esc)"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                className="truncate cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 rounded px-1"
                                onClick={() => startEdit(rowIndex, colIndex, cell)}
                              >
                                {cell || ''}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* 行追加フォーム */}
                  {showAddRow && (
                    <tr className="bg-yellow-50 border-t-2 border-yellow-300">
                      <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-300 bg-yellow-100">
                        新規
                      </td>
                      {newRowValues.map((value, colIndex) => (
                        <td key={colIndex} className="px-2 py-2 border-r border-gray-300">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newValues = [...newRowValues];
                              newValues[colIndex] = e.target.value;
                              setNewRowValues(newValues);
                            }}
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={String.fromCharCode(65 + colIndex)}
                          />
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 行追加アクションボタン */}
            {showAddRow && (
              <div className="flex items-center gap-3 mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm text-gray-700">新しい行を追加します。全ての列に値を入力してください。</p>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={saveNewRow}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✓ 保存
                  </button>
                  <button
                    onClick={cancelAddRow}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ✕ キャンセル
                  </button>
                </div>
              </div>
            )}

            {sheetData.rowCount >= rowLimit && (
              <p className="text-sm text-gray-600 mt-3">
                ⚠ 表示制限: 最初の{rowLimit}行のみ表示しています。全データを見るには行数制限を増やしてください。
              </p>
            )}

            {/* 進捗入力シート専用管理UI */}
            {sheetData.sheetName === '進捗入力シート' && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">進捗入力シート管理</h3>
                <p className="text-sm text-gray-600 mb-4">
                  新工程マスターとの同期、列構造の更新、ガントシートからの予定日取得を行います。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 列構造更新 */}
                  <button
                    onClick={async () => {
                      if (!confirm('列構造を更新しますか？（既存データは保持されます）')) return;
                      setLoading(true);
                      try {
                        const res = await fetch('/api/yumemaga-sheets/update-progress-columns', {
                          method: 'POST',
                        });
                        const json = await res.json();
                        if (json.success) {
                          alert(`✓ ${json.message}\n更新行数: ${json.updatedRows || 0}行`);
                          fetchSheetData(sheetData.sheetName, sheetData.sheetId);
                        } else {
                          alert(`✗ エラー: ${json.error}`);
                        }
                      } catch (error) {
                        alert('✗ エラーが発生しました');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex flex-col items-start gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <Columns className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-900">列構造を更新</div>
                      <div className="text-sm text-blue-700">月号・先方確認ステータス列を追加</div>
                    </div>
                  </button>

                  {/* 新工程をマージ */}
                  <button
                    onClick={async () => {
                      if (!confirm('新工程マスターから工程をマージしますか？\n（新規工程を追加、廃止工程をアーカイブ）')) return;
                      setLoading(true);
                      try {
                        const res = await fetch('/api/yumemaga-sheets/merge-processes', {
                          method: 'POST',
                        });
                        const json = await res.json();
                        if (json.success) {
                          alert(`✓ ${json.message}\n追加: ${json.added}工程\nアーカイブ: ${json.archived}工程`);
                          fetchSheetData(sheetData.sheetName, sheetData.sheetId);
                        } else {
                          alert(`✗ エラー: ${json.error}`);
                        }
                      } catch (error) {
                        alert('✗ エラーが発生しました');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex flex-col items-start gap-2 p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-900">新工程をマージ</div>
                      <div className="text-sm text-green-700">新工程マスターから同期</div>
                    </div>
                  </button>

                  {/* 逆算予定日を更新 */}
                  <button
                    onClick={async () => {
                      const issue = prompt('月号を入力してください（例: 2025年11月号）', '2025年11月号');
                      if (!issue) return;

                      setLoading(true);
                      try {
                        const res = await fetch('/api/yumemaga-sheets/update-planned-dates', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ issue }),
                        });
                        const json = await res.json();
                        if (json.success) {
                          alert(`✓ ${json.message}\n対象: ${json.issue}\n更新: ${json.updated}工程`);
                          fetchSheetData(sheetData.sheetName, sheetData.sheetId);
                        } else {
                          alert(`✗ エラー: ${json.error}`);
                        }
                      } catch (error) {
                        alert('✗ エラーが発生しました');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex flex-col items-start gap-2 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="font-semibold text-purple-900">逆算予定日を更新</div>
                      <div className="text-sm text-purple-700">ガントシートから取得</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
