import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { apiRequest } from "../lib/api";
import { toast } from "sonner";

interface LikeButtonProps {
  articleId: string | number;
  initialLikes: number;
}

export function LikeButton({ articleId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  // Initialize liked state from localStorage
  const [liked, setLiked] = useState(() => {
    try {
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}')
      return !!likedArticles[String(articleId)]
    } catch {
      return false
    }
  });
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (loading) return;

    const previousLiked = liked;
    const previousLikes = likes;

    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked);
    setLikes(newLiked ? likes + 1 : likes - 1);
    setLoading(true);

    // Persist to localStorage
    try {
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}')
      if (newLiked) {
        likedArticles[String(articleId)] = Date.now()
      } else {
        delete likedArticles[String(articleId)]
      }
      localStorage.setItem('likedArticles', JSON.stringify(likedArticles))
    } catch {
      // Ignore localStorage errors
    }

    try {
      const res = await apiRequest<{ success: boolean; likes?: number }>(
        `/articles/${articleId}/like`,
        { method: "POST" }
      );

      if (res.success) {
        if (typeof res.likes === "number") {
          setLikes(res.likes);
        }
      } else {
        // Rollback on error
        setLiked(previousLiked);
        setLikes(previousLikes);
        toast.error(res.error ?? "Gagal menyimpan like");
      }
    } catch {
      // Rollback on error
      setLiked(previousLiked);
      setLikes(previousLikes);
      toast.error("Terjadi kesalahan, silakan coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      onClick={handleLike}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-full border transition-colors"
      style={{
        borderColor: liked ? "rgb(62, 207, 178)" : "rgba(62, 207, 178, 0.3)",
        background: liked ? "rgba(62, 207, 178, 0.1)" : "transparent",
        color: liked ? "rgb(62, 207, 178)" : "#bbcac4",
      }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
    >
      <Heart
        size={20}
        fill={liked ? "rgb(62, 207, 178)" : "none"}
        stroke="rgb(62, 207, 178)"
      />
      <span
        className="text-sm font-medium"
        style={{
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {likes}
      </span>
    </motion.button>
  );
}
