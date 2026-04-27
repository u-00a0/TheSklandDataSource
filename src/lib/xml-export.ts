import fs from 'node:fs';
import path from 'node:path';
import { wikiJsonToXmlBatch } from '@eihrteam/xml';
import { ensureDir } from './fs-utils.ts';
import type { ItemRecord } from './types.ts';

interface XmlExportMeta {
  itemId: string;
  categoryPath: string;
  relPath: string;
}

export interface XmlExportResult {
  files: number;
  warnings: number;
}

function normalizeRelPath(input: string): string {
  return input.replaceAll('\\', '/');
}

export function exportItemXml(itemRecords: ItemRecord[], outDirAbs: string): XmlExportResult {
  const xmlRootAbs = path.join(outDirAbs, 'xml');
  fs.rmSync(xmlRootAbs, { recursive: true, force: true });
  ensureDir(xmlRootAbs);

  const batch = wikiJsonToXmlBatch<XmlExportMeta>(
    itemRecords.map((rec) => ({
      source: rec.payload,
      meta: {
        itemId: rec.itemId,
        categoryPath: normalizeRelPath(rec.categoryPath),
        relPath: normalizeRelPath(rec.relPath),
      },
    })),
  );

  for (const item of batch.items) {
    const meta = item.meta;
    if (!meta) {
      throw new Error('XML export failed: batch item missing metadata');
    }
    const rel = path.join('xml', meta.categoryPath, `id${meta.itemId}.xml`);
    const abs = path.join(outDirAbs, rel);
    ensureDir(path.dirname(abs));
    fs.writeFileSync(abs, item.text.endsWith('\n') ? item.text : `${item.text}\n`, 'utf8');
  }

  return {
    files: batch.items.length,
    warnings: batch.warnings.length,
  };
}
