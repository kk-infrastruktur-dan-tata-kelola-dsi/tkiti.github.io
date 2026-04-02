import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function ImageCTA() {
  return (
    <section className="py-10 px-6">
      <motion.div 
        className="max-w-7xl mx-auto p-1 relative overflow-hidden group"
        style={{
          background: 'rgba(13, 14, 15, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(62, 207, 178, 0.15)',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1631358429403-25d69fb4ce24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbmV0d29yayUyMGdsb2JlJTIwdGVjaG5vbG9neSUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3NDk1MzU0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Infrastructure"
          className="w-full h-96 object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
        />

        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(18, 19, 21, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.h2 
            className="font-bold mb-6 tracking-tighter text-center px-4"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(24px, 5vw, 48px)',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            SIAP MEMBANGUN MASA DEPAN INFRASTRUKTUR?
          </motion.h2>

          <motion.button 
            className="px-10 py-4 font-bold tracking-[0.15em]"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              background: '#3ECFB2',
              color: '#005446',
              borderRadius: '2px',
              boxShadow: '0 0 40px rgba(62, 207, 178, 0.1)',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 60px rgba(62, 207, 178, 0.3)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            BERGABUNG DENGAN KAMI
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}