import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, toAbsoluteApiUrl } from "../lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { XIcon } from "lucide-react";

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

type TeamTreeNode = TeamMember & {
  children: TeamTreeNode[];
};

type Periode = {
  id: number;
  nama: string;
  mulai: string | null;
  selesai: string | null;
  isActive: boolean;
};

function formatPeriodeLabel(periode: Periode) {
  if (periode.mulai || periode.selesai) {
    return `${periode.nama} (${periode.mulai ?? '-'} s/d ${periode.selesai ?? '-'})`;
  }
  return periode.nama;
}

function FamilyTreeNode({
  node,
  compact = false,
  onPersonClick,
}: {
  node: TeamTreeNode;
  compact?: boolean;
  onPersonClick?: (member: TeamMember) => void;
}) {
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
        className={`z-10 min-w-[170px] max-w-[220px] rounded-xl border px-3 py-2.5 ${!isEmpty && onPersonClick ? "cursor-pointer hover:brightness-110" : ""}`}
        style={{
          borderColor: "rgba(62, 207, 178, 0.28)",
          background: "rgba(9, 11, 12, 0.85)",
        }}
        onClick={() => {
          if (!isEmpty && onPersonClick) {
            onPersonClick(node);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border" style={{ borderColor: "rgba(62, 207, 178, 0.25)" }}>
            <AvatarImage src={toAbsoluteApiUrl(node.photo) ?? undefined} alt={node.nama} />
            <AvatarFallback style={{ background: "rgba(62, 207, 178, 0.12)", color: "#61eccd", fontWeight: 700 }}>
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 max-w-[260px]">
            <p className="whitespace-normal break-words text-[10px] uppercase tracking-wide" style={{ color: "#8fd8c8", fontFamily: "JetBrains Mono, monospace" }}>
              {node.role}
            </p>
            <p
              className="truncate text-xs font-semibold"
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
          <div className="h-5 w-px" style={{ background: "rgba(62, 207, 178, 0.35)" }} />
          <ul className={compact ? "relative grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3" : "relative flex flex-wrap items-start justify-center gap-x-4 gap-y-4 pt-4"}>
            <div
              className="absolute left-1/2 top-0 h-px -translate-x-1/2"
              style={{
                width: `calc(100% - 1.5rem)`,
                background: "rgba(62, 207, 178, 0.35)",
              }}
            />
            {node.children.map((child, index) => (
              <li key={`${child.role}-${index}`} className="relative flex flex-col items-center">
                <div className="absolute -top-4 h-4 w-px" style={{ background: "rgba(62, 207, 178, 0.35)" }} />
                <FamilyTreeNode node={child} compact={compact} onPersonClick={onPersonClick} />
              </li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

export function Structure() {
  const [tree, setTree] = useState<TeamTreeNode[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<TeamMember | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resPeriode] = await Promise.all([
          apiRequest<{ success: boolean; data?: Periode[] }>("/struktur/periode"),
        ]);
        const periodeList = resPeriode.success && resPeriode.data ? resPeriode.data : [];
        const activePeriode = periodeList.find((p) => p.isActive) ?? periodeList[0] ?? null;
        const initialPeriodeId = activePeriode?.id ?? null;

        setPeriodes(periodeList);
        setSelectedPeriodeId(initialPeriodeId);

        if (initialPeriodeId) {
          const resMembers = await apiRequest<{ success: boolean; data?: TeamMember[]; tree?: TeamTreeNode[] }>(`/struktur?periodeId=${initialPeriodeId}`);
          if (resMembers.success && resMembers.tree) setTree(resMembers.tree);
        } else {
          setTree([]);
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
    const resMembers = await apiRequest<{ success: boolean; data?: TeamMember[]; tree?: TeamTreeNode[] }>(`/struktur?periodeId=${periodeId}`);
    if (resMembers.success && resMembers.tree) setTree(resMembers.tree);
  }

  const familyTree = useMemo(() => tree, [tree]);

  const compactTree = familyTree.length > 0 && familyTree[0].children.length > 4;

  const personInitials = selectedPerson
    ? selectedPerson.nama
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <section id="struktur" className="px-6 py-14">
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

        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
            style={{ borderColor: "rgba(62, 207, 178, 0.2)", background: "rgba(8, 10, 11, 0.45)" }}
          >
            <label htmlFor="periode-select" className="text-xs" style={{ color: "#9fb6af", fontFamily: "JetBrains Mono, monospace" }}>
              Periode:
            </label>
            <select
              id="periode-select"
              value={selectedPeriodeId ?? ""}
              onChange={(e) => onChangePeriode(Number(e.target.value))}
              className="rounded-full border px-2 py-1 text-xs outline-none"
              style={{
                borderColor: "rgba(62, 207, 178, 0.35)",
                color: "#61eccd",
                background: "rgba(9, 11, 12, 0.95)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {periodes.map((periode) => (
                <option key={periode.id} value={periode.id} style={{ background: "#090b0c", color: "#61eccd" }}>
                  {formatPeriodeLabel(periode)}{periode.isActive ? " [Aktif]" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
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
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="rounded-2xl border p-4 md:p-6"
            style={{ borderColor: "rgba(62, 207, 178, 0.16)", background: "rgba(8, 10, 11, 0.7)" }}
          >
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Memuat struktur organisasi...
            </p>
          </motion.div>
        ) : familyTree.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="rounded-2xl border p-4 md:p-6"
            style={{ borderColor: "rgba(62, 207, 178, 0.16)", background: "rgba(8, 10, 11, 0.7)" }}
          >
            <ul className="flex justify-center pb-1">
              {familyTree.map((root, index) => (
                <FamilyTreeNode key={`${root.role}-${index}`} node={root} compact={compactTree} onPersonClick={setSelectedPerson} />
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="rounded-2xl border p-4 md:p-6"
            style={{ borderColor: "rgba(62, 207, 178, 0.16)", background: "rgba(8, 10, 11, 0.7)" }}
          >
            <p className="text-center text-sm" style={{ color: "#bbcac4", fontFamily: "JetBrains Mono, monospace" }}>
              Data struktur belum tersedia pada periode ini.
            </p>
          </motion.div>
        )}
      </div>

      {/* Person Detail Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => { if (!open) setSelectedPerson(null); }}>
        <DialogContent
          className="border-0 p-0 sm:max-w-md"
          style={{
            background: "rgba(9, 11, 12, 0.97)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(62, 207, 178, 0.2)",
            boxShadow: "0 0 60px rgba(62, 207, 178, 0.15)",
          }}
        >
          <DialogClose
            className="absolute top-4 right-4 z-10 rounded-full p-1 transition-colors hover:bg-white/10"
            style={{ color: "#61eccd" }}
          >
            <XIcon className="h-5 w-5" />
          </DialogClose>

          {selectedPerson && (
            <>
              <DialogHeader className="px-6 pt-8 pb-4">
                <DialogTitle
                  className="text-center tracking-[0.1em]"
                  style={{ fontFamily: "JetBrains Mono, monospace", color: "#61eccd" }}
                >
                  //PERSONNEL_DETAIL
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col items-center px-6 pb-8 gap-5">
                <Avatar
                  className="h-24 w-24 border-2"
                  style={{ borderColor: "rgba(62, 207, 178, 0.35)" }}
                >
                  <AvatarImage
                    src={toAbsoluteApiUrl(selectedPerson.photo) ?? undefined}
                    alt={selectedPerson.nama}
                  />
                  <AvatarFallback
                    className="text-2xl"
                    style={{ background: "rgba(62, 207, 178, 0.12)", color: "#61eccd", fontWeight: 700 }}
                  >
                    {personInitials || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="w-full rounded-xl border px-5 py-4 space-y-3" style={{ borderColor: "rgba(62, 207, 178, 0.2)", background: "rgba(8, 10, 11, 0.6)" }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8fd8c8", fontFamily: "JetBrains Mono, monospace" }}>
                      Nama
                    </p>
                    <p className="text-base font-semibold" style={{ color: "#e3e2e3", fontFamily: "Space Grotesk, sans-serif" }}>
                      {selectedPerson.nama}
                    </p>
                  </div>

                  <div
                    className="h-px w-full"
                    style={{ background: "rgba(62, 207, 178, 0.15)" }}
                  />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8fd8c8", fontFamily: "JetBrains Mono, monospace" }}>
                      Jabatan
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#61eccd", fontFamily: "JetBrains Mono, monospace" }}>
                      {selectedPerson.role}
                    </p>
                  </div>

                  {selectedPerson.divisi && (
                    <>
                      <div
                        className="h-px w-full"
                        style={{ background: "rgba(62, 207, 178, 0.15)" }}
                      />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8fd8c8", fontFamily: "JetBrains Mono, monospace" }}>
                          Divisi
                        </p>
                        <p className="text-sm" style={{ color: "#bbcac4", fontFamily: "Space Grotesk, sans-serif" }}>
                          {selectedPerson.divisi}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

