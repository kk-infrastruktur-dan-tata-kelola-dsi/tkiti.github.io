import { motion } from "motion/react";
import { useContent } from "../hooks/useContent";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Contact() {
  const { data } = useContent("kontak");
  const sectionLabel = data["kontak.section_label"] ?? "//KONTAK";
  const sectionTitle = data["kontak.title"] ?? "HUBUNGI KAMI";
  const email = data["kontak.email"] ?? "labtisi.si@gmail.com";
  const instagram = data["kontak.instagram"] ?? "@lab_TATI";
  const linkedin = data["kontak.linkedin"] ?? "Lab TKITI";
  const alamat =
    data["kontak.alamat"] ??
    "Gedung Teknologi Informasi, Lantai 2\nDepartemen Sistem Informasi\nFakultas Teknologi Informasi";
  const jam = data["kontak.jam"] ?? "Senin – Jumat, 08.00 – 17.00";
  const alamatLines = alamat.split("\n").map((v) => v.trim()).filter(Boolean);
  const contactInfo = [
    {
      icon: "location_on",
      title: "Lokasi",
        details: [
        ...alamatLines
        ],
    },
    {
      icon: "email",
      title: "Kontak",
        details: [
        `Email: ${email}`,
        `Instagram: ${instagram}`,
        `LinkedIn: ${linkedin}`
        ],
    },
    {
      icon: "schedule",
      title: "Jam Operasional",
        details: [
        jam,
        "Praktikum sesuai jadwal kuliah",
        "Konsultasi: booking terlebih dahulu"
      ],
    },
  ];

  return (
    <section id="kontak" className="py-10 px-6 max-w-6xl mx-auto">
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
        {contactInfo.map((info, index) => (
          <motion.div
            key={index}
            className="p-8 group hover:bg-[#61eccd]/5 transition-colors duration-500"
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
            <span
              className="material-symbols-outlined mb-6 group-hover:scale-110 transition-transform block"
              style={{
                fontSize: '36px',
                color: '#61eccd',
              }}
            >
              {info.icon}
            </span>

            <h4
              className="font-bold mb-4 tracking-tight"
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '20px',
              }}
            >
              {info.title}
            </h4>

            <div className="space-y-2">
              {info.details.map((detail, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{
                    color: '#bbcac4',
                  }}
                >
                  {detail}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
