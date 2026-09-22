import { DEFAULT_KEYS } from "./studyEngine";
export const DEFAULT_SETTINGS = {
  shortcuts: true,
  autoplay: false,
  keys: DEFAULT_KEYS,
};
export function loadPreferences(saved) {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    keys: { ...DEFAULT_KEYS, ...saved?.keys },
  };
}
