import { env } from "~/env";

const apiUrl =
  env.NEXT_ENV === "dev"
    ? "http://localhost:8000"
    : env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required when NEXT_ENV is not dev.");
}

export const API_BASE_URL = apiUrl;
