import { Resend } from "resend";
import { getResendConfig } from "@/lib/config";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(getResendConfig().apiKey);
  }
  return client;
}
