import { useEffect, useRef } from "react";
import type { CanvasEffect } from "../../types";

interface EffectCanvasProps {
  effects: CanvasEffect[];
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function EffectCanvas({ effects, width, height }: EffectCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;
        particle.vy += 0.3; // Gravity
        particle.life -= deltaTime;

        if (particle.life <= 0) return false;

        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace("1)", `${alpha})`);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Draw effects
      effects.forEach((effect) => {
        const age = (now - effect.timestamp) / 1000;

        if (effect.type === "radial-light") {
          // Radial light effect (정답 시)
          if (age < 1.5) {
            const radius = Math.min(width, height) * 0.8 * (age / 1.5);
            const gradient = ctx.createRadialGradient(
              width / 2,
              height / 2,
              0,
              width / 2,
              height / 2,
              radius
            );
            
            const alpha = Math.max(0, 1 - age / 1.5);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.6})`);
            gradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.3})`);
            gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          }
        }

        if (effect.type === "spotlight") {
          // Spotlight effect (최후 1인)
          if (age < 3) {
            const alpha = Math.min(1, age / 0.5) * Math.max(0, 1 - (age - 2) / 1);
            
            // Dark overlay
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
            ctx.fillRect(0, 0, width, height);

            // Spotlight
            if (effect.position) {
              const gradient = ctx.createRadialGradient(
                effect.position.x,
                effect.position.y,
                0,
                effect.position.x,
                effect.position.y,
                150
              );
              gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
              gradient.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.3})`);
              gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, width, height);
            }
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [effects, width, height]);

  // Create particles when effect is added
  useEffect(() => {
    const latestEffect = effects[effects.length - 1];
    if (!latestEffect) return;

    if (latestEffect.type === "particles" && latestEffect.position) {
      // Create particle burst (오답 시)
      const particleCount = 30;
      const colors = [
        "rgba(255, 100, 100, 1)",
        "rgba(255, 150, 150, 1)",
        "rgba(200, 100, 200, 1)",
        "rgba(150, 150, 255, 1)",
      ];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 3;
        
        particlesRef.current.push({
          x: latestEffect.position.x,
          y: latestEffect.position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1 + Math.random() * 0.5,
          maxLife: 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
        });
      }
    }
  }, [effects]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
