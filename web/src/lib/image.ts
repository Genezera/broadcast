const AVATAR_SIZE = 256;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ImageProblem = "type" | "size";

/** Valida o arquivo antes de processar; devolve o problema ou `null`. */
export const validateImageFile = (file: {
  type: string;
  size: number;
}): ImageProblem | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) return "type";
  if (file.size > MAX_FILE_BYTES) return "size";
  return null;
};

/** Recorte quadrado centralizado, para a foto não ficar achatada no círculo. */
export const squareCrop = (width: number, height: number) => {
  const size = Math.min(width, height);
  return { sx: (width - size) / 2, sy: (height - size) / 2, size };
};

/**
 * Reduz a foto para um quadrado pequeno em JPEG e devolve como data URL.
 * Fica na casa de 20–40 KB, o que cabe com folga no documento do perfil
 * (por isso não preciso do Firebase Storage para um avatar).
 */
export const fileToAvatarDataUrl = async (
  file: File,
  size = AVATAR_SIZE,
  quality = 0.85,
): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  try {
    const { sx, sy, size: side } = squareCrop(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponível.");
    // Fundo branco: PNGs com transparência não podem virar preto no JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
};
