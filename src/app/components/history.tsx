import { motion } from "motion/react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function History() {
  const timeline = [
    {
      year: "2010",
      title: "Awal Berdiri",
      subtitle: "Pendirian Laboratorium",
      description: "Laboratorium Tata Kelola dan Infrastruktur Teknologi Informasi didirikan di Departemen Sistem Informasi, Fakultas Teknologi Informasi, sebagai respons atas kebutuhan pengelolaan infrastruktur IT yang terstruktur.",
    },
    {
      year: "2015–2018",
      title: "Perubahan Nama & Pengembangan",
      subtitle: "",
      description: "Laboratorium mengalami perubahan nama menjadi Laboratorium Dasar Komputer (LDKDM), kemudian berkembang menjadi LDKTIS. Angkatan ini mulai membangun kegiatan praktikum dan riset dalam bidang komputer.",
    },
    {
      year: "2024",
      title: "Era TKITI",
      subtitle: "Saat Ini",
      description: "Pada semester gasal tahun 2024, terjadi perubahan besar dalam susunan organisasi jabatan. Lab diperkuat oleh pembina dan pengurus yang memiliki spesialisasi teknik masing-masing, dengan visi menjadi laboratorium benchmark dalam pengelolaan infrastruktur teknologi informasi.",
    },
  ];

  return (
    <section id="sejarah" className="py-10 px-6 max-w-4xl mx-auto">
      <motion.h2
        className="tracking-[0.15em] mb-16 text-center"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          color: '#61eccd',
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease }}
      >
        [01_SEJARAH]
      </motion.h2>

      <div className="relative">
        {/* Timeline Line */}
        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2 h-full w-[1px] hidden md:block"
          style={{
            background: 'linear-gradient(to bottom, rgba(97, 236, 205, 0), rgba(97, 236, 205, 0.5), rgba(97, 236, 205, 0))',
            transformOrigin: 'top',
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease }}
        />

        {/* Timeline Items — each slides from its side */}
        {timeline.map((item, index) => {
          const isRight = index === 1;
          return (
            <motion.div
              key={index}
              className={`flex flex-col md:flex-row items-center mb-16 relative ${
                isRight ? 'md:flex-row-reverse' : ''
              }`}
              initial={{ opacity: 0, x: isRight ? 60 : -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
            >
              {/* Content */}
              <div
                className={`w-full md:w-1/2 text-center ${
                  isRight
                    ? 'md:pl-12 md:text-left'
                    : 'md:pr-12 md:text-right'
                }`}
              >
                <motion.div
                  className="font-bold mb-2"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '36px',
                    color: '#61eccd',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.25, ease }}
                >
                  {item.year}
                </motion.div>
                <h4
                  className="font-bold mb-4"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '20px',
                    color: '#e3e2e3',
                  }}
                >
                  {item.title}
                </h4>
                <p
                  className="text-sm"
                  style={{
                    color: '#bbcac4',
                  }}
                >
                  {item.description}
                </p>
              </div>

              {/* Center Node */}
              <motion.div
                className="w-8 h-8 rounded-full border-2 absolute left-1/2 transform -translate-x-1/2 hidden md:block z-10"
                style={{
                  background: '#070809',
                  borderColor: '#61eccd',
                  boxShadow: '0 0 40px rgba(62, 207, 178, 0.1)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3, ease }}
                whileHover={{ scale: 1.2, boxShadow: '0 0 60px rgba(62, 207, 178, 0.3)' }}
              />

              {/* Spacer */}
              <div className="w-full md:w-1/2" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
