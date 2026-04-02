import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { API_URL } from "../lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type TeamMember = {
  id: string | number;
  name?: string;
  nama?: string;
  role?: string;
  photo_url?: string | null;
  photo?: string | null;
};

export function Structure() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await apiRequest<{ success: boolean; data?: TeamMember[] }>("/struktur");
        if (res.success && res.data) {
          const normalized = res.data.map((member) => {
            const name = member.name ?? member.nama ?? "Anggota";
            const rawPhoto = member.photo_url ?? member.photo ?? null;
            const photo = rawPhoto
              ? rawPhoto.startsWith("http")
                ? rawPhoto
                : `${API_URL}/${rawPhoto.replace(/^\//, "")}`
              : null;
            return {
              ...member,
              name,
              role: member.role ?? "-",
              photo_url: photo,
            };
          });
          setMembers(normalized);
        }
      } catch (e) {
        console.error("Failed to fetch structure:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const pillars = [
    {
      icon: "supervisor_account",
      title: "Kepemimpinan",
      description: "Dipimpin oleh Kepala Lab dengan dukungan Wakil dan divisi-divisi fungsional yang spesifik.",
    },
    {
      icon: "groups",
      title: "Anggota",
      description: "Setiap anggota memiliki peran dan tanggung jawab yang jelas sesuai divisi masing-masing.",
    },
    {
      icon: "handshake",
      title: "Kolaborasi",
      description: "Mendorong sinergi antar divisi untuk mewujudkan laboratorium berkelas yang berstandar optimal.",
    },
  ];

  return (
    <section id="struktur" className="py-10 px-6" style={{ background: "rgba(27, 28, 29, 0.3)" }}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="tracking-[0.15em] mb-12 text-center"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            color: "#61eccd",
          }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
        >
          //STRUCTURE_COL
        </motion.h2>

        {/* Pillars Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
          }}
        >
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
              }}
            >
              <motion.div
                className="w-16 h-16 mx-auto flex items-center justify-center mb-4 border"
                style={{
                  background: "rgba(62, 207, 178, 0.1)",
                  borderColor: "rgba(62, 207, 178, 0.2)",
                  borderRadius: "8px",
                }}
                whileHover={{
                  scale: 1.1,
                  background: "rgba(62, 207, 178, 0.15)",
                  borderColor: "rgba(62, 207, 178, 0.4)",
                }}
                transition={{ duration: 0.3 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "32px",
                    color: "#61eccd",
                  }}
                >
                  {pillar.icon}
                </span>
              </motion.div>

              <h3
                className="font-bold mb-2 tracking-tight uppercase"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "20px",
                }}
              >
                {pillar.title}
              </h3>

              <p
                className="text-sm leading-relaxed"
                style={{
                  color: "#bbcac4",
                }}
              >
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Team Members Grid */}
        <motion.div
          className="border-t pt-12"
          style={{ borderColor: "rgba(62, 207, 178, 0.15)" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
        >
          <h3
            className="text-center font-bold mb-8"
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "28px",
              color: "#e3e2e3",
            }}
          >
            ANGGOTA LABORATORIUM
          </h3>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div
                    className="w-24 h-24 rounded-full animate-pulse"
                    style={{ background: "rgba(62, 207, 178, 0.1)" }}
                  />
                  <div
                    className="h-4 w-24 rounded animate-pulse"
                    style={{ background: "rgba(62, 207, 178, 0.1)" }}
                  />
                  <div
                    className="h-3 w-16 rounded animate-pulse"
                    style={{ background: "rgba(62, 207, 178, 0.1)" }}
                  />
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  className="flex flex-col items-center gap-3 group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <Avatar
                    className="w-24 h-24 border-2 transition-colors"
                    style={{
                      borderColor: "rgba(62, 207, 178, 0.2)",
                      background: "rgba(13, 14, 15, 0.6)",
                    }}
                  >
                    <AvatarImage src={member.photo_url || undefined} alt={member.name} />
                    <AvatarFallback
                      style={{
                        background: "rgba(62, 207, 178, 0.1)",
                        color: "#61eccd",
                        fontFamily: "Space Grotesk, sans-serif",
                        fontSize: "20px",
                        fontWeight: 600,
                      }}
                    >
                      {String(member.name ?? "Anggota")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p
                      className="font-bold text-sm"
                      style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        color: "#e3e2e3",
                      }}
                    >
                      {member.name ?? "Anggota"}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color: "#bbcac4",
                      }}
                    >
                      {member.role ?? "-"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p
              className="text-center text-sm"
              style={{
                color: "#bbcac4",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              Data anggota belum tersedia.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
