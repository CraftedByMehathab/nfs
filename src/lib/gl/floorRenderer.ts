import type { Mat3 } from "@/types/geometry";
import { createProgram, uniformLocation } from "./program";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const MAX_ANISOTROPY = 8;
const PHOTO_UNIT = 0;
const FLOOR_UNIT = 1;
const MASK_UNIT = 2;

export type RenderParams = {
  /** Maps normalised image coordinates onto the floor plane; null hides the overlay. */
  imageToPlane: Mat3 | null;
  /** How many times the texture repeats across the perspective corners, in each direction. */
  tiles: readonly [number, number];
  /** 0 shows the original photo, 1 the full overlay. */
  opacity: number;
  /** How strongly the photo's shadows and highlights carry onto the finish, 0..1. */
  shading: number;
  /** Average linear luminance of the original floor; 0 turns shading off. */
  referenceLuminance: number;
};

export type FloorRenderer = {
  setPhoto(photo: ImageBitmap): void;
  setFloorTexture(source: TexImageSource): void;
  /** White where the floor finish is shown, black elsewhere; same framing as the photo. */
  setMask(source: TexImageSource): void;
  render(params: RenderParams): void;
  dispose(): void;
};

function createTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

/** Clamped at the edges, with mipmaps so the shader can read blurred copies. */
function setClamped(gl: WebGL2RenderingContext): void {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/** Uploads a colour image; sampling it returns linear light. */
function uploadColor(gl: WebGL2RenderingContext, source: TexImageSource): void {
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

/** Sharpens the texture where the floor recedes at a shallow angle, when supported. */
function enableAnisotropy(gl: WebGL2RenderingContext): void {
  const extension = gl.getExtension("EXT_texture_filter_anisotropic");
  if (!extension) return;
  const limit: unknown = gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
  if (typeof limit !== "number") return;
  gl.texParameterf(
    gl.TEXTURE_2D,
    extension.TEXTURE_MAX_ANISOTROPY_EXT,
    Math.min(MAX_ANISOTROPY, limit),
  );
}

export function createFloorRenderer(canvas: HTMLCanvasElement): FloorRenderer {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
  if (!gl) throw new Error("WebGL2 is not supported");

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const uniforms = {
    photo: uniformLocation(gl, program, "u_photo"),
    floor: uniformLocation(gl, program, "u_floor"),
    mask: uniformLocation(gl, program, "u_mask"),
    imageToPlane: uniformLocation(gl, program, "u_imageToPlane"),
    tiles: uniformLocation(gl, program, "u_tiles"),
    opacity: uniformLocation(gl, program, "u_opacity"),
    shading: uniformLocation(gl, program, "u_shading"),
    referenceLuminance: uniformLocation(gl, program, "u_referenceLuminance"),
  };
  // The triangle comes from gl_VertexID, but WebGL2 still needs a bound vertex array.
  const vertexArray = gl.createVertexArray();

  gl.activeTexture(gl.TEXTURE0 + PHOTO_UNIT);
  const photoTexture = createTexture(gl);
  setClamped(gl);

  gl.activeTexture(gl.TEXTURE0 + MASK_UNIT);
  const maskTexture = createTexture(gl);
  setClamped(gl);

  gl.activeTexture(gl.TEXTURE0 + FLOOR_UNIT);
  const floorTexture = createTexture(gl);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  enableAnisotropy(gl);

  let hasPhoto = false;
  let hasFloor = false;
  let hasMask = false;
  let disposed = false;

  return {
    setPhoto(photo) {
      canvas.width = photo.width;
      canvas.height = photo.height;
      gl.viewport(0, 0, photo.width, photo.height);
      gl.activeTexture(gl.TEXTURE0 + PHOTO_UNIT);
      uploadColor(gl, photo);
      gl.generateMipmap(gl.TEXTURE_2D);
      hasPhoto = true;
    },

    setFloorTexture(source) {
      gl.activeTexture(gl.TEXTURE0 + FLOOR_UNIT);
      uploadColor(gl, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      hasFloor = true;
    },

    setMask(source) {
      gl.activeTexture(gl.TEXTURE0 + MASK_UNIT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      hasMask = true;
    },

    render({ imageToPlane, tiles, opacity, shading, referenceLuminance }) {
      if (!hasPhoto) return;
      const showOverlay = hasFloor && hasMask && imageToPlane !== null;
      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
      gl.uniform1i(uniforms.photo, PHOTO_UNIT);
      gl.uniform1i(uniforms.floor, FLOOR_UNIT);
      gl.uniform1i(uniforms.mask, MASK_UNIT);
      // Mat3 is row-major; GLSL is column-major, so ask WebGL to transpose.
      gl.uniformMatrix3fv(uniforms.imageToPlane, true, [...(imageToPlane ?? IDENTITY)]);
      gl.uniform2f(uniforms.tiles, tiles[0], tiles[1]);
      gl.uniform1f(uniforms.opacity, showOverlay ? opacity : 0);
      gl.uniform1f(uniforms.shading, shading);
      gl.uniform1f(uniforms.referenceLuminance, referenceLuminance);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteTexture(photoTexture);
      gl.deleteTexture(floorTexture);
      gl.deleteTexture(maskTexture);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
    },
  };
}
