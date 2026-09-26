<script setup lang="ts">
import { computed } from 'vue';

interface DisplayDate {
  datetime?: string;
  label: string;
}

const props = defineProps<{
  value: unknown;
}>();

const dateTimePattern = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function isValidDateParts(year: number, month: number, day: number): boolean {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

function formatParts(
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number,
  second?: number,
): string {
  const date = `${year}年${month}月${day}日`;
  if (hour === undefined || minute === undefined) return date;

  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return second ? `${date} ${time}:${String(second).padStart(2, '0')}` : `${date} ${time}`;
}

function fromDate(value: Date): DisplayDate | null {
  if (Number.isNaN(value.getTime())) return null;

  const year = value.getUTCFullYear();
  const month = value.getUTCMonth() + 1;
  const day = value.getUTCDate();
  const hour = value.getUTCHours();
  const minute = value.getUTCMinutes();
  const second = value.getUTCSeconds();
  const hasTime = hour !== 0 || minute !== 0 || second !== 0;

  return {
    datetime: hasTime ? value.toISOString() : value.toISOString().slice(0, 10),
    label: hasTime
      ? formatParts(year, month, day, hour, minute, second)
      : formatParts(year, month, day),
  };
}

function normalizeDate(value: unknown): DisplayDate | null {
  if (value instanceof Date) return fromDate(value);
  if (typeof value === 'number') return fromDate(new Date(value));
  if (typeof value !== 'string') return null;

  const source = value.trim();
  if (!source) return null;

  const match = source.match(dateTimePattern);
  if (!match) return { label: source };

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = hourText === undefined ? undefined : Number(hourText);
  const minute = minuteText === undefined ? undefined : Number(minuteText);
  const second = secondText === undefined ? undefined : Number(secondText);

  if (!isValidDateParts(year, month, day)) return { label: source };
  if (hour !== undefined && (hour > 23 || minute === undefined || minute > 59 || (second ?? 0) > 59)) {
    return { label: source };
  }

  const hasTime = hour !== undefined && (hour !== 0 || minute !== 0 || (second ?? 0) !== 0);
  const datePart = `${yearText.padStart(4, '0')}-${monthText.padStart(2, '0')}-${dayText.padStart(2, '0')}`;

  return {
    datetime: hasTime ? source.replace(' ', 'T') : datePart,
    label: hasTime
      ? formatParts(year, month, day, hour, minute, second)
      : formatParts(year, month, day),
  };
}

const displayDate = computed(() => normalizeDate(props.value));
</script>

<template>
  <p v-if="displayDate" class="doc-date">
    <span class="doc-date__label">文档日期</span>
    <time :datetime="displayDate.datetime">{{ displayDate.label }}</time>
  </p>
</template>

<style scoped>
.doc-date {
  display: flex;
  gap: 0.55rem;
  align-items: baseline;
  margin: 0 0 12px;
  color: var(--vp-c-text-2);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.doc-date__label {
  color: var(--vp-c-text-3);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.doc-date__label::after {
  margin-left: 0.55rem;
  color: var(--vp-c-divider);
  content: '·';
}
</style>
