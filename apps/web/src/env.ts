import { createEnv } from "@t3-oss/env-core"; // или @t3-oss/env-vite
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.string().url(),
  },
  
  runtimeEnv: {
    VITE_API_URL: import.meta.env.VITE_API_URL,
  },
  emptyStringAsUndefined: true,
});