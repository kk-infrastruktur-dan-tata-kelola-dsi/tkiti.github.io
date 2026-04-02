import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, toAbsoluteApiUrl } from "../lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type TeamMember = {
  id: number;
  nama: string;
  role: string;
  divisi: string | null;
  parentId: number | null;
  photo: string | null;
  urutan: number | null;
};

type TreeMember = TeamMember & { children: TreeMember[] };

function buildTree(members: TeamMember[]): TreeMember[] {
  const map = new Map<number, TreeMember>();
  const sorted = [...members].sort((a, b) => (a.urutan ?? Number.MAX_SAFE_INTEGER) - (b.urutan ?? Number.MAX_SAFE_INTEGER) || a.id - b.id);

  for (const member of sorted) {
    map.set(member.id, { ...member, children: [] });
  }

  const roots: TreeMember[] = [];
  for (const member of sorted) {
    const node = map.get(member.id);
    if (!node) continue;
    if (member.parentId && map.has(member.parentId)) {
      map.get(member.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function MemberCard({ member, depth }: { member: TreeMember; depth: number }) {
  const photo = toAbsoluteApiUrl(member.photo);
  const initial = member.nama
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease }}
        className="rounded-xl border px-4 py-4"
        style={{
          borderColor: "rgba(62, 207, 178, 0.2)",
          background: "rgba(10, 12, 13, 0.75)",
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border" style={{ borderColor: "rgba(62, 207, 178, 0.28)" }}>
            <AvatarImage src={photo ?? undefined} alt={member.nama} />
            <AvatarFallback style={{ background: "rgba(62, 207, 178, 0.12)", color: "#61eccd", fontWeight: 600 }}>
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold" style={{ color: "#e3e2e3", fontFamily: "Space Grotesk, sans-serif" }}>
              {member.nama}
            </p>
            <p className="truncate text-xs" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              {member.role}
            </p>
          </div>
        </div>
      </motion.div>

      {member.children.length > 0 && (
        <div className="mt-5 space-y-4 pl-6" style={{ borderLeft: "1px solid rgba(62, 207, 178, 0.25)" }}>
          {member.children.map((child) => (
            <MemberCard key={child.id} member={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Structure() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await apiRequest<{ success: boolean; data?: TeamMember[] }>("/struktur");
        if (res.success && res.data) {
          setMembers(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch structure:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const tree = useMemo(() => buildTree(members), [members]);

  return (
    <section id="struktur" className="px-6 py-14" style={{ background: "rgba(27, 28, 29, 0.3)" }}>
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="mb-12 text-center tracking-[0.15em]"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#61eccd" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
        >
          //STRUCTURE_COL
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="rounded-2xl border p-6 md:p-8"
          style={{ borderColor: "rgba(62, 207, 178, 0.16)", background: "rgba(8, 10, 11, 0.7)" }}
        >
          {loading ? (
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Memuat struktur organisasi...
            </p>
          ) : tree.length > 0 ? (
            <div className="space-y-6">
              {tree.map((root) => (
                <MemberCard key={root.id} member={root} depth={0} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Data struktur organisasi belum tersedia.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

