import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

export function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await apiRequest<{ success: boolean; data?: GalleryImage[] }>("/api/gallery");
        if (res.success && res.data) {
          setImages(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch gallery:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <section id="gallery" className="py-10 px-6 max-w-6xl mx-auto">
      <motion.div
        className="flex justify-between items-end mb-12"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease }}
      >
        <div>
          <motion.h2
            className="tracking-[0.15em] mb-4"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#61eccd",
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
          >
            //GALLERY
          </motion.h2>
          <motion.h3
            className="font-bold"
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "32px",
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
          >
            DOKUMENTASI KEGIATAN
          </motion.h3>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full h-64"
              style={{ background: "rgba(62, 207, 178, 0.1)" }}
            />
          ))}
        </div>
      ) : images.length > 0 ? (
        <>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
            }}
          >
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                className="relative overflow-hidden group cursor-pointer"
                style={{
                  background: "rgba(13, 14, 15, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(62, 207, 178, 0.15)",
                  height: "280px",
                }}
                variants={{
                  hidden: { opacity: 0, scale: 0.92, y: 20 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease } },
                }}
                whileHover={{ scale: 1.02, borderColor: "rgba(62, 207, 178, 0.35)" }}
                onClick={() => setSelectedImage(image)}
              >
                <ImageWithFallback
                  src={image.url}
                  alt={image.alt || "Gallery image"}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                {(image.alt || image.caption) && (
                  <div
                    className="absolute bottom-0 left-0 right-0 p-4 text-sm"
                    style={{
                      background: "linear-gradient(to top, rgba(7, 8, 9, 0.9), transparent)",
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#bbcac4",
                    }}
                  >
                    {image.caption || image.alt}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Lightbox Dialog */}
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogPortal>
              <DialogOverlay
                style={{
                  background: "rgba(0, 0, 0, 0.9)",
                  backdropFilter: "blur(4px)",
                }}
              />
              <DialogContent
                className="max-w-4xl p-0 overflow-hidden border-0"
                style={{
                  background: "transparent",
                }}
              >
                {selectedImage && (
                  <div className="relative">
                    <ImageWithFallback
                      src={selectedImage.url}
                      alt={selectedImage.alt || "Full size gallery image"}
                      className="w-full h-auto max-h-[85vh] object-contain"
                    />
                    {(selectedImage.alt || selectedImage.caption) && (
                      <div
                        className="absolute bottom-0 left-0 right-0 p-4 text-sm"
                        style={{
                          background: "linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)",
                          fontFamily: "JetBrains Mono, monospace",
                          color: "#bbcac4",
                          textAlign: "center",
                        }}
                      >
                        {selectedImage.caption || selectedImage.alt}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </>
      ) : (
        <div
          className="text-center py-12"
          style={{
            border: "1px solid rgba(62, 207, 178, 0.15)",
            borderRadius: "8px",
            background: "rgba(13, 14, 15, 0.6)",
          }}
        >
          <p
            className="text-sm"
            style={{
              color: "#bbcac4",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            Galeri foto belum tersedia.
          </p>
        </div>
      )}
    </section>
  );
}
