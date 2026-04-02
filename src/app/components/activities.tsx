import { motion } from "motion/react";
import { useContent } from "../hooks/useContent";

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
        className="flex justify-between items-end mb-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease }}
      >
        <div>
          <motion.h2
            className="tracking-[0.15em] mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: '#61eccd',
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
          >
            {sectionLabel}
          </motion.h2>
          <motion.h3
            className="font-bold"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '36px',
            }}
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
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: '#bbcac4',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          REF_ID: TKITI_SEC_02<br />
          STATUS: OPERATIONAL
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
        }}
      >
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            className="p-8 group hover:bg-[#61eccd]/5 transition-colors duration-500 relative overflow-hidden"
            style={{
              background: 'rgba(13, 14, 15, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(62, 207, 178, 0.15)',
            }}
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
            }}
            whileHover={{ y: -5, borderColor: 'rgba(62, 207, 178, 0.35)' }}
          >
            <div
              className="absolute top-0 right-0 p-4 opacity-30"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#61eccd',
              }}
            >
              {activity.id}
            </div>

            <span
              className="material-symbols-outlined mb-6 group-hover:scale-110 transition-transform block"
              style={{
                fontSize: '36px',
                color: '#61eccd',
              }}
            >
              {activity.icon}
            </span>

            <h4
              className="font-bold mb-4 tracking-tight"
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '20px',
              }}
            >
              {activity.title}
            </h4>

            <p
              className="text-sm leading-relaxed mb-6"
              style={{
                color: '#bbcac4',
              }}
            >
              {activity.description}
            </p>

            <div
              className="w-full h-[1px] group-hover:bg-[#61eccd]/60 transition-colors"
              style={{
                background: 'rgba(62, 207, 178, 0.2)',
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
