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
  periodeId: number | null;
  photo: string | null;
  urutan: number | null;
};

type TemplateNode = {
  role: string;
  parentRole: string | null;
  urutan: number;
  divisi: string | null;
};

type Periode = {
  id: number;
  nama: string;
  mulai: string | null;
  selesai: string | null;
  isActive: boolean;
};

type FamilyNode = {
  role: string;
  nama: string;
  photo: string | null;
  urutan: number;
  children: FamilyNode[];
};

function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildFamilyTree(members: TeamMember[], template: TemplateNode[]): FamilyNode[] {
  const memberByRole = new Map<string, TeamMember>();
  for (const member of members) {
    memberByRole.set(normalizeRole(member.role), member);
  }

  const nodeByRole = new Map<string, FamilyNode>();
  for (const t of template) {
    const member = memberByRole.get(normalizeRole(t.role));
    nodeByRole.set(normalizeRole(t.role), {
      role: t.role,
      nama: member?.nama ?? "Belum diisi",
      photo: member?.photo ?? null,
      urutan: t.urutan,
      children: [],
    });
  }

  const roots: FamilyNode[] = [];
  for (const t of template) {
    const node = nodeByRole.get(normalizeRole(t.role));
    if (!node) continue;
    if (!t.parentRole) {
      roots.push(node);
      continue;
    }
    const parent = nodeByRole.get(normalizeRole(t.parentRole));
    if (parent) parent.children.push(node);
  }

  const sortDeep = (nodes: FamilyNode[]) => {
    nodes.sort((a, b) => a.urutan - b.urutan);
    nodes.forEach((n) => sortDeep(n.children));
  };
  sortDeep(roots);
  return roots;
}

function FamilyTreeNode({ node }: { node: FamilyNode }) {
  const initials = node.nama
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isEmpty = node.nama === "Belum diisi";

  return (
    <li className="relative flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease }}
        className="z-10 min-w-[210px] rounded-xl border px-4 py-3"
        style={{
          borderColor: "rgba(62, 207, 178, 0.28)",
          background: "rgba(9, 11, 12, 0.85)",
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border" style={{ borderColor: "rgba(62, 207, 178, 0.25)" }}>
            <AvatarImage src={toAbsoluteApiUrl(node.photo) ?? undefined} alt={node.nama} />
            <AvatarFallback style={{ background: "rgba(62, 207, 178, 0.12)", color: "#61eccd", fontWeight: 700 }}>
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-wide" style={{ color: "#8fd8c8", fontFamily: "JetBrains Mono, monospace" }}>
              {node.role}
            </p>
            <p
              className="truncate text-sm font-semibold"
              style={{
                color: isEmpty ? "rgba(227,226,227,0.45)" : "#e3e2e3",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {node.nama}
            </p>
          </div>
        </div>
      </motion.div>

      {node.children.length > 0 && (
        <>
          <div className="h-7 w-px" style={{ background: "rgba(62, 207, 178, 0.35)" }} />
          <ul className="relative flex flex-wrap items-start justify-center gap-x-6 gap-y-6 pt-5">
            <div
              className="absolute left-1/2 top-0 h-px -translate-x-1/2"
              style={{
                width: `calc(100% - 2rem)`,
                background: "rgba(62, 207, 178, 0.35)",
              }}
            />
            {node.children.map((child, index) => (
              <li key={`${child.role}-${index}`} className="relative flex flex-col items-center">
                <div className="absolute -top-5 h-5 w-px" style={{ background: "rgba(62, 207, 178, 0.35)" }} />
                <FamilyTreeNode node={child} />
              </li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

export function Structure() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [template, setTemplate] = useState<TemplateNode[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resPeriode, resTemplate] = await Promise.all([
          apiRequest<{ success: boolean; data?: Periode[] }>("/struktur/periode"),
          apiRequest<{ success: boolean; data?: TemplateNode[] }>("/struktur/template"),
        ]);
        const periodeList = resPeriode.success && resPeriode.data ? resPeriode.data : [];
        const activePeriode = periodeList.find((p) => p.isActive) ?? periodeList[0] ?? null;
        const initialPeriodeId = activePeriode?.id ?? null;

        if (resTemplate.success && resTemplate.data) setTemplate(resTemplate.data);
        setPeriodes(periodeList);
        setSelectedPeriodeId(initialPeriodeId);

        if (initialPeriodeId) {
          const resMembers = await apiRequest<{ success: boolean; data?: TeamMember[] }>(`/struktur?periodeId=${initialPeriodeId}`);
          if (resMembers.success && resMembers.data) setMembers(resMembers.data);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error("Failed to fetch structure:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function onChangePeriode(periodeId: number) {
    setSelectedPeriodeId(periodeId);
    const resMembers = await apiRequest<{ success: boolean; data?: TeamMember[] }>(`/struktur?periodeId=${periodeId}`);
    if (resMembers.success && resMembers.data) setMembers(resMembers.data);
  }

  const familyTree = useMemo(() => buildFamilyTree(members, template), [members, template]);

  return (
    <section id="struktur" className="px-6 py-14" style={{ background: "rgba(27, 28, 29, 0.3)" }}>
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="mb-8 text-center tracking-[0.15em]"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#61eccd" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
        >
          //STRUCTURE_COL
        </motion.h2>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {periodes.map((periode) => {
            const isSelected = selectedPeriodeId === periode.id;
            return (
              <button
                key={periode.id}
                type="button"
                onClick={() => onChangePeriode(periode.id)}
                className="rounded-full border px-3 py-1 text-xs transition-colors"
                style={{
                  borderColor: isSelected ? "rgba(62, 207, 178, 0.55)" : "rgba(62, 207, 178, 0.2)",
                  color: isSelected ? "#61eccd" : "#9fb6af",
                  background: isSelected ? "rgba(62, 207, 178, 0.08)" : "transparent",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {periode.nama}
                {periode.isActive ? " (Aktif)" : ""}
              </button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="overflow-x-auto rounded-2xl border p-6 md:p-8"
          style={{ borderColor: "rgba(62, 207, 178, 0.16)", background: "rgba(8, 10, 11, 0.7)" }}
        >
          {loading ? (
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Memuat struktur organisasi...
            </p>
          ) : familyTree.length > 0 ? (
            <ul className="flex min-w-max justify-center pb-2">
              {familyTree.map((root, index) => (
                <FamilyTreeNode key={`${root.role}-${index}`} node={root} />
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Data struktur belum tersedia pada periode ini.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

