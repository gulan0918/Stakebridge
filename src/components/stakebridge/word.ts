import {
  chronological,
  displayDate,
  fileSize,
  SECTIONS,
  type Workspace,
} from "./model.ts";

const encoder = new TextEncoder();
const xml = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function paragraph(text: string, style = "Normal"): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(
      (line) =>
        `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${xml(line)}</w:t></w:r></w:p>`,
    )
    .join("");
}

/** A standard, uncompressed ZIP package. No scripts or external assets are embedded. */
function zip(entries: Record<string, string>): Uint8Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let crc = n;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    table[n] = crc >>> 0;
  }
  const chunks: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  for (const [path, text] of Object.entries(entries)) {
    const name = encoder.encode(path);
    const data = encoder.encode(text);
    let crc = 0xffffffff;
    for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = new Uint8Array(30 + name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(12, 33, true); // 1980-01-01, the earliest ZIP date.
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    chunks.push(local, data);
    const central = new Uint8Array(46 + name.length);
    const header = new DataView(central.buffer);
    header.setUint32(0, 0x02014b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 20, true);
    header.setUint16(8, 0x0800, true);
    header.setUint16(14, 33, true);
    header.setUint32(16, crc, true);
    header.setUint32(20, data.length, true);
    header.setUint32(24, data.length, true);
    header.setUint16(28, name.length, true);
    header.setUint32(42, offset, true);
    central.set(name, 46);
    directory.push(central);
    offset += local.length + data.length;
  }
  const directoryLength = directory.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, directory.length, true);
  endView.setUint16(10, directory.length, true);
  endView.setUint32(12, directoryLength, true);
  endView.setUint32(16, offset, true);
  const result = new Uint8Array(offset + directoryLength + end.length);
  let position = 0;
  for (const part of [...chunks, ...directory, end]) {
    result.set(part, position);
    position += part.length;
  }
  return result;
}

export function exportWord(workspace: Workspace, includeDrafts: boolean): Blob {
  const body = [
    paragraph(workspace.project, "Title"),
    paragraph(
      `${workspace.team} · StakeBridge stakeholder engagement report`,
      "Subtitle",
    ),
    paragraph(
      "Organised along the product journey. Interviews appear in chronological order within each stage; undated drafts appear last.",
    ),
    paragraph(
      "This report contains interview notes and attachment names. Original recordings and documents are included in a StakeBridge backup, not embedded in this Word file.",
    ),
  ];
  for (const stage of workspace.stages) {
    body.push(paragraph(stage.name, "Heading1"));
    const items = chronological(
      workspace.stakeholders.filter(
        (item) =>
          item.stageId === stage.id &&
          (includeDrafts || item.status === "complete"),
      ),
    );
    if (!items.length)
      body.push(paragraph("No interviews recorded for this stage."));
    for (const item of items) {
      body.push(
        paragraph(
          `${item.name.trim() || "Unnamed stakeholder"}${item.status === "draft" ? " [Draft]" : ""}`,
          "Heading2",
        ),
      );
      body.push(
        paragraph(
          `Interview date: ${displayDate(item.date)}${item.role ? ` · ${item.role}` : ""}`,
        ),
      );
      if (item.source)
        body.push(
          paragraph(
            `Planning reference: ${item.source.entryId}, revision ${item.source.revision}. Source: ${item.source.url}`,
          ),
        );
      for (const section of SECTIONS) {
        body.push(paragraph(section.title, "Heading3"));
        body.push(paragraph(item[section.key].trim() || "Not recorded yet."));
        for (const file of item.attachments.filter(
          (attachment) => attachment.section === section.key,
        ))
          body.push(
            paragraph(
              `Attachment: ${file.name} (${fileSize(file.size)})`,
              "Attachment",
            ),
          );
      }
    }
  }
  const heading = (level: number, size: number) =>
    `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="140"/><w:outlineLvl w:val="${level - 1}"/></w:pPr><w:rPr><w:b/><w:color w:val="223C81"/><w:sz w:val="${size}"/></w:rPr></w:style>`;
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const files = {
    "[Content_Types].xml": `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
    "_rels/.rels": `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/_rels/document.xml.rels": `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "word/styles.xml": `${declaration}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Microsoft YaHei"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="526680"/></w:rPr></w:style>${heading(1, 32)}${heading(2, 27)}${heading(3, 24)}<w:style w:type="paragraph" w:styleId="Attachment"><w:name w:val="Attachment"/><w:basedOn w:val="Normal"/><w:rPr><w:i/><w:color w:val="526680"/><w:sz w:val="19"/></w:rPr></w:style></w:styles>`,
    "word/document.xml": `${declaration}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`,
  };
  const bytes = zip(files);
  return new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
