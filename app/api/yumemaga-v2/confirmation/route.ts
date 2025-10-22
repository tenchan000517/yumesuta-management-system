import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * ∫çÿJSONÙ∞API (V2˛‹)
 *
 * ∫çÿÂnJSON°:
 * - ?p°p?˛‹	
 * - Óc·‚˛‹
 * - ÿÂÓcÂπ∆¸øπOK/Óc	í2
 *
 * JSONÀ :
 * {
 *   "drafts": [
 *     {
 *       "version": 1,
 *       "sentDate": "2025-10-21",
 *       "status": "Óc",
 *       "revisionDate": "2025-10-22",
 *       "notes": "h«∂§Û	Ù"
 *     }
 *   ],
 *   "finalDate": "2025-10-23",
 *   "finalVersion": 2
 * }
 */

/**
 * j˜íáWk	€1-indexed	
 * @param col - j˜1=A, 26=Z, 27=AA	
 * @returns áWã: "A", "Z", "AA"	
 */
function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

interface DraftData {
  version: number;
  sentDate: string;
  status: 'OK' | 'Óc';
  revisionDate?: string;
  notes?: string;
}

interface ConfirmationData {
  drafts: DraftData[];
  finalDate: string | null;
  finalVersion: number | null;
}

interface ConfirmationUpdateRequest {
  issue: string;
  processNo: string;
  action: 'add_draft' | 'update_draft' | 'finalize';
  draft?: DraftData;
}

export async function PUT(request: Request) {
  try {
    const { issue, processNo, action, draft } = await request.json() as ConfirmationUpdateRequest;

    // –Í«¸∑ÁÛ
    if (!issue || !processNo || !action) {
      return NextResponse.json(
        { success: false, error: '˜ÂNo¢Ø∑ÁÛíöWfO`UD' },
        { status: 400 }
      );
    }

    if ((action === 'add_draft' || action === 'update_draft') && !draft) {
      return NextResponse.json(
        { success: false, error: 'add_draft/update_draft¢Ø∑ÁÛko draft «¸øL≈ÅgY' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 2Weõ∑¸»_V2nÿ√¿¸Lhh«¸øí≠ºÄ
    const progressData = await getSheetData(spreadsheetId, '2Weõ∑¸»_V2!A1:GV100');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '2Weõ∑¸»_V2LãdKä~[ì' },
        { status: 404 }
      );
    }

    // 2. ÿ√¿¸LKârSÂnü>(JSON)íyö
    const headers = progressData[0];
    let actualCol = -1;

    for (let col = 1; col < headers.length; col++) {
      const header = headers[col];
      if (!header) continue;

      // "${processNo}ü>(JSON)" í¢Y
      if (header === `${processNo}ü>(JSON)`) {
        actualCol = col;
        break;
      }
    }

    if (actualCol === -1) {
      return NextResponse.json(
        { success: false, error: `∫çÿÂ ${processNo} LãdKä~[ìJSON°ÂgojDÔ˝'LBä~Y	` },
        { status: 404 }
      );
    }

    // 3. rS˜nLíyö
    const rowIndex = progressData.findIndex((row, i) => i > 0 && row[0] === issue);

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `˜ ${issue} LãdKä~[ì` },
        { status: 404 }
      );
    }

    // 4. ˛(nJSONí÷ó
    const currentJSON = progressData[rowIndex][actualCol];
    let confirmationData: ConfirmationData;

    if (currentJSON && typeof currentJSON === 'string' && currentJSON.trim().startsWith('{')) {
      try {
        confirmationData = JSON.parse(currentJSON);
      } catch (error) {
        console.error(`JSON„ê®È¸ (${processNo}):`, error);
        confirmationData = { drafts: [], finalDate: null, finalVersion: null };
      }
    } else {
      confirmationData = { drafts: [], finalDate: null, finalVersion: null };
    }

    // 5. ¢Ø∑ÁÛk‹XfJSONíÙ∞
    if (action === 'add_draft') {
      if (!draft) {
        return NextResponse.json(
          { success: false, error: 'draft «¸øL≈ÅgY' },
          { status: 400 }
        );
      }
      confirmationData.drafts.push(draft);
      console.log(`=› ?˝†: ${processNo} - ,${draft.version}? (${draft.sentDate})`);
    } else if (action === 'update_draft') {
      if (!draft) {
        return NextResponse.json(
          { success: false, error: 'draft «¸øL≈ÅgY' },
          { status: 400 }
        );
      }
      const draftIndex = confirmationData.drafts.findIndex(d => d.version === draft.version);
      if (draftIndex === -1) {
        return NextResponse.json(
          { success: false, error: `,${draft.version}?LãdKä~[ì` },
          { status: 404 }
        );
      }
      confirmationData.drafts[draftIndex] = draft;
      console.log(`=› ?Ù∞: ${processNo} - ,${draft.version}?`);
    } else if (action === 'finalize') {
      if (confirmationData.drafts.length === 0) {
        return NextResponse.json(
          { success: false, error: '∫öYã?LBä~[ì' },
          { status: 400 }
        );
      }
      const latestDraft = confirmationData.drafts[confirmationData.drafts.length - 1];
      confirmationData.finalDate = latestDraft.sentDate;
      confirmationData.finalVersion = latestDraft.version;
      console.log(` ∫ö: ${processNo} - ,${latestDraft.version}? (${latestDraft.sentDate})`);
    }

    // 6. Ù∞W_JSONí∑¸»k¯Mº
    const colLetter = getColumnLetter(actualCol);
    const range = `2Weõ∑¸»_V2!${colLetter}${rowIndex + 1}`;

    await updateSheetData(
      spreadsheetId,
      range,
      [[JSON.stringify(confirmationData)]]
    );

    return NextResponse.json({
      success: true,
      issue,
      processNo,
      action,
      confirmationData,
      updated: {
        range,
        column: colLetter,
        row: rowIndex + 1,
      }
    });

  } catch (error: any) {
    console.error('∫çÿJSONÙ∞®È¸:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '∫çÿ«¸ønÙ∞k1WW~W_',
      },
      { status: 500 }
    );
  }
}
