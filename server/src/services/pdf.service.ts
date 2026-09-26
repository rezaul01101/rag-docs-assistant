import fs from "node:fs";
import { PDFParse } from "pdf-parse";

export async function extractTextFromFile(fullPath: string, mimetype: string): Promise<string> {
  if (mimetype === "text/plain") {
    return fs.readFileSync(fullPath, "utf-8");
  }

  const parser = new PDFParse({ data: fs.readFileSync(fullPath) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
