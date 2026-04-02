import { motion, useMotionValue, useTransform, animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, count, value]);

  return (
    <motion.span ref={ref}>
      {useTransform(rounded, (latest) => latest + suffix)}
    </motion.span>
  );
}

export function Stats() {
  const stats = [
    { value: 10, suffix: "+", label: "Tahun Berdiri" },
    { value: 6, suffix: "+", label: "Teknologi Dikuasai" },
    { value: 300, suffix: "+", label: "Alumni Laboratorium" },
    { value: 24, suffix: "/7", label: "Monitoring Aktif" },
  ];

  return (
    <section className="py-10 px-6 max-w-6xl mx-auto">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="group"
            variants={{
              hidden: { opacity: 0, scale: 0.5, y: 20 },
              visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
            }}
          >
            <div 
              className="font-bold mb-2 transition-transform group-hover:scale-110"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 'clamp(48px, 6vw, 64px)',
                color: '#61eccd',
              }}
            >
              <Counter value={stat.value} suffix={stat.suffix} />
            </div>
            <div 
              className="tracking-[0.15em] uppercase opacity-60"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: '#bbcac4',
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
