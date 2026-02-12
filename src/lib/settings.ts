import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MDRIP_DIR = "mdrip";
const SETTINGS_FILE = "settings.json";

export interface MdripSettings {
  allowFileModifications?: boolean;
}

function getSettingsPath(cwd: string): string {
  return join(cwd, MDRIP_DIR, SETTINGS_FILE);
}

export async function ensureMdripDir(cwd: string): Promise<void> {
  const mdripDir = join(cwd, MDRIP_DIR);
  if (!existsSync(mdripDir)) {
    await mkdir(mdripDir, { recursive: true });
  }
}

export async function readSettings(
  cwd: string = process.cwd(),
): Promise<MdripSettings> {
  const settingsPath = getSettingsPath(cwd);

  if (!existsSync(settingsPath)) {
    return {};
  }

  try {
    const content = await readFile(settingsPath, "utf-8");
    return JSON.parse(content) as MdripSettings;
  } catch {
    return {};
  }
}

export async function writeSettings(
  settings: MdripSettings,
  cwd: string = process.cwd(),
): Promise<void> {
  await ensureMdripDir(cwd);
  const settingsPath = getSettingsPath(cwd);
  await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

export async function getFileModificationPermission(
  cwd: string = process.cwd(),
): Promise<boolean | undefined> {
  const settings = await readSettings(cwd);
  return settings.allowFileModifications;
}

export async function setFileModificationPermission(
  allowed: boolean,
  cwd: string = process.cwd(),
): Promise<void> {
  const settings = await readSettings(cwd);
  settings.allowFileModifications = allowed;
  await writeSettings(settings, cwd);
}
