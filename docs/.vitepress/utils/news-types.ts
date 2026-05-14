import type { DefaultTheme } from 'vitepress';

export interface NewsEntry {
  title: string;
  url: string;
  excerpt?: string;
  timestamp: number;
  dateLabel: string;
  day: number;
  monthLabel: string;
  year: string;
  monthKey: string;
  category: string;
}

export interface NewsCardItem {
  title: string;
  url: string;
  excerpt?: string;
  timestamp: number;
  dateLabel: string;
  day: number;
  monthLabel: string;
}

export interface NewsArchiveNode extends DefaultTheme.SidebarItem {
  timestamp: number;
  items?: NewsArchiveNode[];
}
