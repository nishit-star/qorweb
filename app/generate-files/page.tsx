import { redirect } from "next/navigation";

export default function GenerateFilesRedirect() {
  // Unconditional redirect to the Files tab in Brand Monitor
  redirect("/brand-monitor#files");
}
