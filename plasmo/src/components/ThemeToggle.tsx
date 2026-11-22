'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type ThemeMode = 'system' | 'light' | 'dark';

const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const THEME_META: Record<ThemeMode, { label: string; nextLabel: string }> = {
  system: { label: 'システム', nextLabel: 'ライト' },
  light: { label: 'ライト', nextLabel: 'ダーク' },
  dark: { label: 'ダーク', nextLabel: 'システム' },
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // マウントが完了するまで（クライアント側で準備ができるまで）ボタンを描画しない
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  const currentTheme: ThemeMode =
    theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
  const meta = THEME_META[currentTheme];

  return (
    <button
      onClick={() => setTheme(NEXT_THEME[currentTheme])}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`テーマ切り替え（現在: ${meta.label}）`}
      title={`テーマ: ${meta.label}（クリックで${meta.nextLabel}に切り替え）`}
      type="button"
    >
      {currentTheme === 'system' ? (
        <Monitor className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      ) : currentTheme === 'light' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      )}
    </button>
  );
}