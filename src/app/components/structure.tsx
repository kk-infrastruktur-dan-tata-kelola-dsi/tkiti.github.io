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

type TemplateNode = {
  role: string;
  parentRole: string | null;
  urutan: number;
  divisi: string | null;
};

type TreeNode = TeamMember & { children: TreeNode[] };

function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildTreeFromTemplate(members: TeamMember[], template: TemplateNode[]): TreeNode[] {
  const memberByRole = new Map<string, TeamMember[]>();
  for (const member of members) {
    const key = normalizeRole(member.role);
    const list = memberByRole.get(key) ?? [];
    list.push(member);
    memberByRole.set(key, list);
  }

  const nodeByRole = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of template) {
    const key = normalizeRole(item.role);
    const firstMember = (memberByRole.get(key) ?? [])[0];
    const fallbackIdSeed = Math.abs(
      Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0),
    );

    nodeByRole.set(key, {
      id: firstMember?.id ?? 100000 + fallbackIdSeed,
      nama: firstMember?.nama ?? "Belum diisi",
      role: item.role,
      divisi: item.divisi,
      parentId: null,
      photo: firstMember?.photo ?? null,
      urutan: item.urutan,
      children: [],
    });
  }

  for (const item of template) {
    const key = normalizeRole(item.role);
    const node = nodeByRole.get(key);
    if (!node) continue;
    if (!item.parentRole) {
      roots.push(node);
      continue;
    }
    const parent = nodeByRole.get(normalizeRole(item.parentRole));
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortDeep = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.urutan ?? Number.MAX_SAFE_INTEGER) - (b.urutan ?? Number.MAX_SAFE_INTEGER));
    nodes.forEach((node) => sortDeep(node.children));
  };
  sortDeep(roots);
  return roots;
}

function NodeCard({ node, depth }: { node: TreeNode; depth: number }) {
  const photo = toAbsoluteApiUrl(node.photo);
  const initial = node.nama
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isEmpty = node.nama === "Belum diisi";

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
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
          <Avatar className="h-12 w-12 border" style={{ borderColor: "rgba(62, 207, 178, 0.25)" }}>
            <AvatarImage src={photo ?? undefined} alt={node.nama} />
            <AvatarFallback style={{ background: "rgba(62, 207, 178, 0.1)", color: "#61eccd", fontWeight: 600 }}>
              {initial || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "#e3e2e3", fontFamily: "Space Grotesk, sans-serif" }}>
              {node.role}
            </p>
            <p className="truncate text-xs" style={{ color: isEmpty ? "rgba(227,226,227,0.42)" : "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              {node.nama}
            </p>
          </div>
        </div>
      </motion.div>

      {node.children.length > 0 && (
        <div className="mt-5 space-y-4 pl-6" style={{ borderLeft: "1px solid rgba(62, 207, 178, 0.25)" }}>
          {node.children.map((child) => (
            <NodeCard key={`${child.role}-${depth + 1}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Structure() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [template, setTemplate] = useState<TemplateNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resMembers, resTemplate] = await Promise.all([
          apiRequest<{ success: boolean; data?: TeamMember[] }>("/struktur"),
          apiRequest<{ success: boolean; data?: TemplateNode[] }>("/struktur/template"),
        ]);
        if (resMembers.success && resMembers.data) setMembers(resMembers.data);
        if (resTemplate.success && resTemplate.data) setTemplate(resTemplate.data);
      } catch (error) {
        console.error("Failed to fetch structure:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const tree = useMemo(() => buildTreeFromTemplate(members, template), [members, template]);

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
                <NodeCard key={root.role} node={root} depth={0} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Template struktur belum tersedia.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

