let cached: boolean | undefined;

function probe(): boolean {
  const gl = document.createElement("canvas").getContext("webgl2");
  // Free the throwaway context straight away; browsers cap how many can exist.
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return gl !== null;
}

/** Whether this browser can create a WebGL2 context. Browser-only. */
export function isWebGL2Available(): boolean {
  cached ??= probe();
  return cached;
}
