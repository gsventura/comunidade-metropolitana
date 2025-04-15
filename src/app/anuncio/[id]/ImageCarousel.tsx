"use client";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useCallback, useRef } from "react";

const transitionDuration = 350; // ms

export default function ImageCarousel({ images, titulo }: { images: string[]; titulo: string }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const slide = (dir: 'left' | 'right') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => {
        if (dir === 'left') return (c - 1 + images.length) % images.length;
        return (c + 1) % images.length;
      });
      setAnimating(false);
      setDirection(null);
    }, transitionDuration);
  };

  const next = useCallback(() => slide('right'), [images.length, animating]);
  const prev = useCallback(() => slide('left'), [images.length, animating]);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    touchEnd.current = e.changedTouches[0].clientX;
    if (touchStart.current !== null && touchEnd.current !== null) {
      const dx = touchEnd.current - touchStart.current;
      if (dx > 40) prev();
      if (dx < -40) next();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  // Animation classes
  const getSlideClass = () => {
    if (!direction) return '';
    if (direction === 'right') return 'slide-right';
    if (direction === 'left') return 'slide-left';
    return '';
  };

  return (
    <div
      className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow bg-zinc-100 flex items-center justify-center select-none"
      style={{ minHeight: 180, maxHeight: 340 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        aria-label="Anterior"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/60 rounded-full hover:bg-white transition"
        style={{ display: images.length > 1 ? 'block' : 'none' }}
        tabIndex={images.length > 1 ? 0 : -1}
        type="button"
        disabled={animating}
      >
        <ChevronLeft className="h-6 w-6 text-zinc-700" />
      </button>
      <button
        aria-label="Próxima"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/60 rounded-full hover:bg-white transition"
        style={{ display: images.length > 1 ? 'block' : 'none' }}
        tabIndex={images.length > 1 ? 0 : -1}
        type="button"
        disabled={animating}
      >
        <ChevronRight className="h-6 w-6 text-zinc-700" />
      </button>
      <div
        className={`w-full h-full flex items-center justify-center transition-transform duration-[${transitionDuration}ms] ease-in-out ${getSlideClass()}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          transform: direction === 'right'
            ? `translateX(-100%)`
            : direction === 'left'
            ? `translateX(100%)`
            : `translateX(0)`
        }}
      >
        <Image
          src={images[current]}
          alt={`Imagem ${current + 1} de ${titulo}`}
          fill
          style={{ objectFit: "cover" }}
          className="bg-zinc-100 transition-all duration-300 rounded-xl"
          priority
          draggable={false}
        />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${idx === current ? 'bg-zinc-800' : 'bg-zinc-300'}`}
            />
          ))}
        </div>
      )}
      <style jsx>{`
        .slide-right {
          animation: slideRight ${transitionDuration}ms forwards;
        }
        .slide-left {
          animation: slideLeft ${transitionDuration}ms forwards;
        }
        @keyframes slideRight {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        @keyframes slideLeft {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}