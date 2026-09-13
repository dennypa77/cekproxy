import { z } from "zod";

// Pesan validasi bawaan zod dalam Bahasa Indonesia (untuk field yang tidak punya pesan khusus).
z.config(z.locales.id());

export { z };
