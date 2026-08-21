"use client";

import { motion } from "framer-motion";
import { CustomerReviewsSection } from "@/components/home/CustomerReviewsSection";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Breadcrumb / Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <nav className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-amber-500 transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft size={14} />
          <span className="text-zinc-900 dark:text-white font-bold">آراء وتجارب العملاء</span>
        </nav>
      </div>

      {/* Main Reviews Section Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CustomerReviewsSection />
      </motion.div>
    </div>
  );
}
