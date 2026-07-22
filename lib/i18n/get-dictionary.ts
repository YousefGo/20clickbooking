import "server-only";
import type { Locale } from "./config";
import en from "./dictionaries/en.json";

const dictionaries = {
  ar: () => import("./dictionaries/ar.json").then((mod) => mod.default),
  en: () => import("./dictionaries/en.json").then((mod) => mod.default),
};

export type Dictionary = typeof en;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
