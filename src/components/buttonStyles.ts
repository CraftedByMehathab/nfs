// 44px is the smallest size a finger hits reliably, so every control is at least that tall.
const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium disabled:opacity-50";

export const SECONDARY_BUTTON = `${BUTTON} border-black/10 dark:border-white/20`;
export const ACTIVE_BUTTON = `${BUTTON} border-transparent bg-foreground text-background`;

/** An underlined text link or button, with a finger-sized touch area. */
export const TEXT_LINK = "inline-flex min-h-11 min-w-11 items-center text-sm font-medium underline disabled:opacity-50";
