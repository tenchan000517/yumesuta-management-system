# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ゆめスタ統合マネジメントシステム** - Unified management dashboard for all business operations.

**Core Objective**: Enable a single manager to oversee all business operations (sales, magazine production, partner management, analytics, SNS, tasks) even as the sales team scales from 1 to 10 members.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build --turbopack

# Production server
npm start

# Linting
npm run lint
```

The dev server uses Turbopack and runs on http://localhost:3000.

## 🚨 CRITICAL: DO NOT RUN THESE COMMANDS

**NEVER run the following commands under ANY circumstances:**

```bash
# ❌ ABSOLUTELY FORBIDDEN - Will kill Claude Code process
killall -9 node
pkill -9 node
kill -9 <node_process_id>
```

**Why**: These commands will terminate the Claude Code process itself, causing immediate session termination.

**For cache clearing**: Only use these safe commands:
```bash
rm -rf .next
rm -rf node_modules/.cache
```

Then ask the user to manually restart `npm run dev`.

## Architecture

### Data Flow Pattern

All features follow a consistent **read-only, manual-update** pattern:

```
Google Sheets (data source)
    ↓ (User clicks "更新" button)
API Route (/app/api/*/route.ts)
    ↓ (Fetches via Google Sheets API)
Dashboard Page (/app/dashboard/*/page.tsx)
    ↓
Display to user
```

**Important**: This is a **display-only MVP**. No write operations to Google Sheets. All data entry happens directly in Google Sheets.

### Core Libraries

- **Google Sheets Integration**: `lib/google-sheets.ts` - All spreadsheet access goes through this module
  - `getSheetData(spreadsheetId, range)` - Fetch data from a range
  - `getBatchSheetData(spreadsheetId, ranges[])` - Fetch multiple ranges
  - `getSpreadsheetMetadata(spreadsheetId)` - Get sheet structure
  - Uses service account authentication via `GOOGLE_SERVICE_ACCOUNT_KEY` env var

### Environment Variables

Required in `.env.local`:
- `GOOGLE_SERVICE_ACCOUNT_KEY` - JSON service account credentials (read-only scope)
- `SALES_SPREADSHEET_ID` - Sales management spreadsheet ID
- `YUMEMAGA_SPREADSHEET_ID` - Phase4 reverse scheduler spreadsheet ID
- `PARTNERS_SPREADSHEET_ID` - Partners & Stars data spreadsheet ID

### Type System

Types are organized by feature domain:
- `types/sales.ts` - Sales KPI and metrics types
- `types/process.ts` - Production process/Gantt chart types
- More types to be added per feature (partners, analytics, sns, tasks)

Each API response follows the pattern:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

## Feature Implementation Pattern

When implementing new features (e.g., Phase 1-4: Partners), follow this sequence:

1. **Investigate spreadsheet structure** - Create a test API route to fetch sample data
2. **Define types** - Create types in `types/*.ts` based on spreadsheet structure
3. **Build API route** - Create `/app/api/[feature]/route.ts` to parse and return typed data
4. **Build dashboard page** - Create `/app/dashboard/[feature]/page.tsx` with "更新" button
5. **Add navigation** - Update `app/page.tsx` to link to the new dashboard
6. **Test** - Verify data loads correctly

### Parsing Spreadsheet Data

Google Sheets API returns `any[][]` (2D array). API routes are responsible for:
- Parsing raw data into structured types
- Handling missing/malformed data gracefully
- Converting Japanese text statuses (e.g., "順調", "遅れ") to typed enums
- Removing empty rows

Example from `api/sales-kpi/route.ts`:
```typescript
const kpiData = await getSheetData(spreadsheetId, 'KPIダッシュボード!A1:K20');
const response = parseKPIData(kpiData); // Transform to typed structure
```

## Phase4 Reverse Scheduler (ゆめマガ制作)

Special architecture for magazine production tracking:

- **Multi-issue support**: Each magazine issue has its own Gantt sheet (e.g., "逆算配置_ガント_2025年11月号")
- **Dynamic sheet selection**: API extracts available issues from sheet metadata, allows filtering by `?issue=2025年11月号`
- **Gantt data structure**:
  - Headers = dates (columns)
  - Rows = process tasks
  - Cell values = status/layer indicators
- **97 processes** tracked with 60-day reverse scheduling from publication deadline

## UI Conventions

- **Icons**: Use `lucide-react` only (never custom icon libraries)
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **Status colors**:
  - Green (bg-green-100/text-green-800) = OK/順調
  - Yellow (bg-yellow-100/text-yellow-800) = Warning/遅れ
  - Red (bg-red-100/text-red-800) = Error/重大な遅れ
- **Disabled features**: Show as opacity-50 with "準備中" label (see `app/page.tsx`)

## MVP Scope Constraints

**MUST follow these rules**:
- ❌ No write operations to Google Sheets
- ❌ No automatic polling/refresh (manual "更新" button only)
- ❌ No authentication system (MVP runs locally or in VPC)
- ❌ No emoji usage except status indicators (✅ 順調, ⚠ 遅れ)
- ✅ Read-only display
- ✅ Manual refresh via button clicks
- ✅ Simple, functional implementation over optimization

Phase 2+ will add: bidirectional sync, auto-refresh, HP auto-updates, SNS content management.

## Documentation

All critical documentation is in `/docs`:
- `docs/development/development-progress.md` - **Primary source of truth** for current implementation status
- `docs/requirements/requirements-definition.md` - Full requirements (v2.0)
- `docs/SYSTEM_OVERVIEW.md` - User-facing system explanation
- `docs/development/START_PROMPT.md` - Session initialization guide

**Always check `development-progress.md` first** to understand current phase and next tasks.

## Development Workflow

1. Read `docs/development/development-progress.md` to identify current task
2. Update todo list with specific implementation steps
3. Implement feature following the pattern above
4. Test with `npm run dev`
5. Mark tasks complete in todo list
6. Update `development-progress.md` when phase completes
7. Confirm with user before proceeding to next phase

## Common Patterns

### API Route Template
```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.FEATURE_SPREADSHEET_ID!;
    const data = await getSheetData(spreadsheetId, 'Sheet!A1:Z100');
    const parsed = parseData(data);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Dashboard Page Template
```typescript
'use client';
import { useState } from 'react';

export default function FeatureDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    const res = await fetch('/api/feature');
    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleRefresh}>更新</button>
      {/* Display data */}
    </div>
  );
}
```

## Current Development Status

As of Phase 1-4 (Partners & Stars Data Management):
- ✅ Phase 1-1: Infrastructure (Google Sheets API integration)
- ✅ Phase 1-2: Sales progress management
- ✅ Phase 1-3: Magazine production progress (Phase4 scheduler)
- ⏳ Phase 1-4: Partners & Stars data management (in progress)
- ⏳ Phase 1-5: HP/LLMO analytics
- ⏳ Phase 1-6: SNS posting management
- ⏳ Phase 1-7: Task/project management
- ⏳ Phase 1-8: Integration & testing
