import { motion } from "motion/react";
import { useContent } from "../hooks/useContent";
import { NeonGlobe } from "./neon-globe";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Activities() {
  const { data } = useContent("kegiatan");
  const sectionLabel = data["kegiatan.section_label"] ?? "//KEGIATAN_LAB";
  const sectionTitle = data["kegiatan.title"] ?? "CORE CAPABILITIES";
  const activities = Array.from({ length: 6 }, (_, index) => {
    const id = String(index + 1).padStart(3, "0");
    return {
      id: data[`kegiatan.card${index + 1}.id`] ?? id,
      icon: data[`kegiatan.card${index + 1}.icon`] ?? ["memory", "layers", "hub", "shield", "insights", "school"][index],
      title: data[`kegiatan.card${index + 1}.title`] ?? [
        "Perawatan Komputer Laboratorium",
        "Manajemen Virtualisasi (Proxmox)",
        "Manajemen Jaringan & Server",
        "Keamanan & Audit Sistem",
        "Monitoring & Observability",
        "Pelatihan & Asistensi Praktikum",
      ][index],
      tag: data[`kegiatan.card${index + 1}.tag`] ?? ["Hardware & Software", "Virtualisasi", "Networking", "Security", "Monitoring", "Edukasi"][index],
      description: data[`kegiatan.card${index + 1}.description`] ?? [
        "Pemeliharaan rutin, pengecekan hardware, update software, dan optimasi performa seluruh komputer di laboratorium untuk memastikan kesiapan operasional harian.",
        "Pemantauan performa, serta optimasi resource pada platform Proxmox VE — termasuk manajemen VM, container, dan alokasi jaringan virtual untuk mendukung riset dan praktikum.",
        "Perancangan, konfigurasi, dan pemantauan jaringan komputer, administrasi server Linux, serta pengelolaan layanan web dan aplikasi berbasis cloud maupun on-premise.",
        "Evaluasi kerentanan sistem, penetration testing dasar, konfigurasi firewall, serta audit kepatuhan untuk memastikan keamanan infrastruktur laboratorium.",
        "Pemantauan real-time performa server, jaringan, dan layanan menggunakan dashboard monitoring untuk mendeteksi anomali dan memastikan uptime maksimal.",
        "Mendukung kegiatan praktikum mahasiswa, membimbing penggunaan tools teknis, serta menyelenggarakan workshop singkat terkait infrastruktur dan tata kelola TI.",
      ][index],
    };
  });

  return (
    <section id="kegiatan" className="py-10 px-6 max-w-6xl mx-auto">
      <motion.div
        className="flex justify-between items-end mb-12"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease }}
      >
        <div>
          <motion.h2
            className="tracking-[0.15em] mb-4"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: '#61eccd' }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
          >
            {sectionLabel}
          </motion.h2>
          <motion.h3
            className="font-bold"
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px' }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
          >
            {sectionTitle}
          </motion.h3>
        </div>
        <motion.div
          className="hidden md:block text-xs text-right opacity-40"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: '#bbcac4' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          REF_ID: TKITI_SEC_02<br />
          STATUS: OPERATIONAL
        </motion.div>
      </motion.div>

      {/* Globe left + capabilities right */}
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center lg:items-start">

        {/* Globe */}
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease }}
        >
          <NeonGlobe size={420} />
        </motion.div>

        {/* Capabilities — 1 column, 6 rows */}
        <motion.div
          className="flex-1 w-full flex flex-col gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
        >
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              className="flex items-center gap-4 px-5 py-4 group hover:bg-[#61eccd]/5 transition-colors duration-500 relative"
              style={{
                background: 'rgba(13, 14, 15, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(62, 207, 178, 0.15)',
              }}
              variants={{
                hidden: { opacity: 0, x: 24 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
              }}
              whileHover={{ borderColor: 'rgba(62, 207, 178, 0.35)' }}
            >
              {/* Icon box */}
              <div
                className="shrink-0 w-11 h-11 flex items-center justify-center"
                style={{
                  border: '1px solid rgba(62, 207, 178, 0.2)',
                  background: 'rgba(62, 207, 178, 0.05)',
                }}
              >
                <span
                  className="material-symbols-outlined group-hover:scale-110 transition-transform"
                  style={{ fontSize: '22px', color: '#61eccd' }}
                >
                  {activity.icon}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h4
                  className="font-bold mb-0.5 truncate"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px' }}
                >
                  {activity.title}
                </h4>
                <p
                  className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: '#bbcac4' }}
                >
                  {activity.description}
                </p>
              </div>

              {/* Tag + ID */}
              <div className="shrink-0 text-right hidden sm:block">
                <div
                  className="text-[9px] tracking-widest opacity-50 mb-1 uppercase"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: '#61eccd' }}
                >
                  {activity.tag}
                </div>
                <div
                  className="text-[9px] opacity-25"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: '#61eccd' }}
                >
                  {activity.id}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
