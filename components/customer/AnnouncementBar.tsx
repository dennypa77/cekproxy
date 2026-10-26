import { getAnnouncement } from "@/lib/announcement";
import { AnnouncementBarClient } from "./AnnouncementBarClient";

/** Pita pengumuman di atas halaman customer. Isinya dari env `PENGUMUMAN`. */
export function AnnouncementBar() {
  const announcement = getAnnouncement();
  if (!announcement) return null;
  return <AnnouncementBarClient id={announcement.id} text={announcement.text} />;
}
