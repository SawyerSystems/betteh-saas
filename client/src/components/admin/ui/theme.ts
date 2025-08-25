export const adminBrand = {
  primary: "#0F0276",
  accent: "#2A4A9B",
  gold: "#D8BD2A",
};

// Common glass classes used across admin components
export const glass = {
  base:
    "border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg",
  dark: "dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90",
};

export const transitions = {
  soft: "transition-all duration-200",
  medium: "transition-all duration-300",
};

export const buttonStyles = {
  action:
    "bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl rounded-xl px-6 py-3 font-semibold text-white",
  outlineGlass:
    "border-slate-200/60 bg-white/80 hover:bg-white/90 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30 dark:hover:bg-[#0F0276]/50 backdrop-blur-sm rounded-xl px-6 py-3 font-semibold",
  danger:
    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-md hover:shadow-lg rounded-lg px-3 py-2 font-semibold text-white",
  subtle:
    "bg-white/80 hover:bg-white/90 border-0 shadow-md hover:shadow-lg rounded-lg px-3 py-2 font-semibold dark:bg-white/10 dark:hover:bg-white/15",
};
