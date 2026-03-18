export const voiceLanguages = [
  { code: "en-IN", label: "English", nativeLabel: "English" },
  { code: "hi-IN", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "bn-IN", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "ta-IN", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te-IN", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "kn-IN", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "Malayalam", nativeLabel: "മലയാളം" },
  { code: "mr-IN", label: "Marathi", nativeLabel: "मराठी" },
  { code: "gu-IN", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "pa-IN", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "od-IN", label: "Odia", nativeLabel: "ଓଡ଼ିଆ" },
];

export function getVoiceLanguageByCode(code) {
  return voiceLanguages.find((language) => language.code === code) || voiceLanguages[7];
}
