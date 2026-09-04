'use client';

import { useEffect, useRef } from 'react';

export type ProfileCanvasMode = 'lightning' | 'blue-fire' | null;

type Point = {
  x: number;
  y: number;
};

type FireParticle = Point & {
  age: number;
  life: number;
  normalX: number;
  normalY: number;
  originX: number;
  originY: number;
  phase: number;
  size: number;
  sprite: number;
  velocityX: number;
  velocityY: number;
};

type LightningPath = {
  points: Point[];
  strength: number;
};

type LightningBolt = {
  age: number;
  life: number;
  paths: LightningPath[];
};

const randomBetween = (minimum: number, maximum: number) => (
  minimum + Math.random() * (maximum - minimum)
);

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
);

function createFireParticle(width: number, height: number, visibleTop: number): FireParticle {
  const verticalLength = Math.max(1, height - visibleTop);
  const perimeterLength = (width * 2) + (verticalLength * 2);
  const perimeterPosition = Math.random() * perimeterLength;
  const speed = randomBetween(24, 62);
  const tangentSpeed = randomBetween(-13, 13);

  let x = 0;
  let y = visibleTop;
  let normalX = 0;
  let normalY = 1;

  if (perimeterPosition < width) {
    x = perimeterPosition;
  } else if (perimeterPosition < width * 2) {
    x = perimeterPosition - width;
    y = height;
    normalY = -1;
  } else if (perimeterPosition < (width * 2) + verticalLength) {
    y = visibleTop + perimeterPosition - (width * 2);
    normalX = 1;
    normalY = 0;
  } else {
    x = width;
    y = visibleTop + perimeterPosition - (width * 2) - verticalLength;
    normalX = -1;
    normalY = 0;
  }

  const tangentX = -normalY;
  const tangentY = normalX;

  return {
    x,
    y,
    age: 0,
    life: randomBetween(0.45, 0.95),
    normalX,
    normalY,
    originX: x,
    originY: y,
    phase: Math.random() * Math.PI * 2,
    size: randomBetween(7, 15),
    sprite: Math.floor(Math.random() * 3),
    velocityX: (normalX * speed) + (tangentX * tangentSpeed),
    velocityY: (normalY * speed) + (tangentY * tangentSpeed)
  };
}

function makeJaggedPath(start: Point, end: Point, segmentCount: number, jitter: number) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const perpendicularX = -deltaY / length;
  const perpendicularY = deltaX / length;
  const points: Point[] = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const taper = Math.sin(progress * Math.PI);
    const offset = index === 0 || index === segmentCount
      ? 0
      : randomBetween(-jitter, jitter) * taper;

    points.push({
      x: start.x + (deltaX * progress) + (perpendicularX * offset),
      y: start.y + (deltaY * progress) + (perpendicularY * offset)
    });
  }

  return points;
}

function createLightningBolt(width: number, height: number, visibleTop: number): LightningBolt {
  const strikeType = Math.random();
  let start: Point;
  let end: Point;

  if (strikeType < 0.58) {
    start = {
      x: randomBetween(width * 0.04, width * 0.96),
      y: visibleTop + randomBetween(0, 28)
    };
    end = {
      x: clamp(start.x + randomBetween(-width * 0.28, width * 0.28), 24, width - 24),
      y: randomBetween(Math.max(visibleTop + 180, height * 0.42), height - 24)
    };
  } else if (strikeType < 0.82) {
    const fromLeft = Math.random() < 0.5;
    start = {
      x: fromLeft ? 0 : width,
      y: randomBetween(visibleTop + 28, height * 0.78)
    };
    end = {
      x: fromLeft ? randomBetween(width * 0.28, width * 0.74) : randomBetween(width * 0.26, width * 0.72),
      y: clamp(start.y + randomBetween(-height * 0.2, height * 0.3), visibleTop + 30, height - 30)
    };
  } else {
    start = {
      x: randomBetween(width * 0.12, width * 0.88),
      y: randomBetween(visibleTop + 25, height * 0.45)
    };
    end = {
      x: clamp(start.x + randomBetween(-width * 0.34, width * 0.34), 22, width - 22),
      y: clamp(start.y + randomBetween(height * 0.22, height * 0.54), visibleTop + 120, height - 20)
    };
  }

  const strikeLength = Math.hypot(end.x - start.x, end.y - start.y);
  const segmentCount = Math.round(clamp(strikeLength / 25, 12, 25));
  const mainPoints = makeJaggedPath(start, end, segmentCount, clamp(strikeLength * 0.1, 24, 58));
  const paths: LightningPath[] = [{ points: mainPoints, strength: 1 }];
  const branchCount = Math.floor(randomBetween(3, 7));

  for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
    const originIndex = Math.floor(randomBetween(3, mainPoints.length - 3));
    const origin = mainPoints[originIndex];
    const nextPoint = mainPoints[Math.min(originIndex + 1, mainPoints.length - 1)];
    const mainAngle = Math.atan2(nextPoint.y - origin.y, nextPoint.x - origin.x);
    const branchAngle = mainAngle + (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.48, 1.08);
    const branchLength = strikeLength * randomBetween(0.12, 0.28);
    const branchEnd = {
      x: clamp(origin.x + Math.cos(branchAngle) * branchLength, 5, width - 5),
      y: clamp(origin.y + Math.sin(branchAngle) * branchLength, visibleTop + 5, height - 5)
    };

    paths.push({
      points: makeJaggedPath(
        origin,
        branchEnd,
        Math.floor(randomBetween(5, 10)),
        clamp(branchLength * 0.12, 8, 24)
      ),
      strength: randomBetween(0.35, 0.62)
    });
  }

  return {
    age: 0,
    life: randomBetween(0.32, 0.56),
    paths
  };
}

function traceLightningPath(context: CanvasRenderingContext2D, path: Point[]) {
  context.beginPath();
  context.moveTo(path[0].x, path[0].y);

  for (let index = 1; index < path.length; index += 1) {
    context.lineTo(path[index].x, path[index].y);
  }

  context.stroke();
}

function lightningFlicker(progress: number) {
  if (progress < 0.1) return 1;
  if (progress < 0.2) return 0.18;
  if (progress < 0.5) return 1;
  if (progress < 0.62) return 0.28;
  if (progress < 0.84) return 0.9;
  return Math.max(0, (1 - progress) / 0.16);
}

export function ProfileAnimationCanvas({ mode }: { mode: ProfileCanvasMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !mode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let previousTime = performance.now();
    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let visibleTop = 0;
    let fireSpawnRemainder = 0;
    let nextLightningStrike = previousTime + randomBetween(80, 360);
    let fireParticles: FireParticle[] = [];
    let lightningBolts: LightningBolt[] = [];
    const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
    const clearCanvas = () => {
      // Clear backing-store pixels, not scaled CSS coordinates. This also removes
      // edge glow when zoom, resizing, or a context reset changes the drawing scale.
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
    };
    const resizeCanvas = () => {
      const rectangle = canvas.getBoundingClientRect();
      pixelRatio = getPixelRatio();
      width = Math.max(1, rectangle.width);
      height = Math.max(1, rectangle.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);

      const navigationBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom ?? 0;
      visibleTop = clamp(navigationBottom - rectangle.top, 0, height * 0.3);
      fireParticles = [];
      lightningBolts = [];
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    const drawFire = (deltaTime: number, currentTime: number) => {
      const visibleHeight = Math.max(1, height - visibleTop);
      const perimeter = (width * 2) + (visibleHeight * 2);
      const particlesPerSecond = clamp(perimeter / 15, 150, 270);
      fireSpawnRemainder += particlesPerSecond * deltaTime;

      while (fireSpawnRemainder >= 1) {
        fireParticles.push(createFireParticle(width, height, visibleTop));
        fireSpawnRemainder -= 1;
      }

      context.save();
      context.globalCompositeOperation = 'lighter';
      const borderPulse = 0.25 + (Math.sin(currentTime * 0.004) + 1) * 0.11;
      context.strokeStyle = `rgba(38, 174, 255, ${borderPulse})`;
      context.lineWidth = 2;
      context.shadowColor = 'rgba(0, 128, 255, 0.9)';
      context.shadowBlur = 18;
      context.strokeRect(2, visibleTop + 2, Math.max(0, width - 4), Math.max(0, visibleHeight - 4));

      fireParticles = fireParticles.filter((particle) => {
        particle.age += deltaTime;

        if (particle.age >= particle.life) {
          return false;
        }

        const progress = particle.age / particle.life;
        const tangentX = -particle.normalY;
        const tangentY = particle.normalX;
        const turbulence = Math.sin((currentTime * 0.009) + particle.phase) * 13;
        particle.x += (particle.velocityX + tangentX * turbulence) * deltaTime;
        particle.y += (particle.velocityY + tangentY * turbulence) * deltaTime;
        particle.velocityX *= Math.pow(0.985, deltaTime * 60);
        particle.velocityY *= Math.pow(0.985, deltaTime * 60);

        const fadeIn = Math.min(1, progress * 7);
        const fadeOut = Math.pow(1 - progress, 1.25);
        const flicker = 0.72 + Math.sin((currentTime * 0.018) + particle.phase) * 0.18;
        const drawSize = particle.size * (0.78 + progress * 0.42);
        const tipX = particle.x + particle.normalX * drawSize * 0.45;
        const tipY = particle.y + particle.normalY * drawSize * 0.45;
        const middleX = (particle.originX + tipX) / 2;
        const middleY = (particle.originY + tipY) / 2;
        const curve = Math.sin((currentTime * 0.012) + particle.phase) * drawSize * 0.7;
        const baseHalfWidth = drawSize * (0.5 - progress * 0.16);
        const particleAlpha = clamp(fadeIn * fadeOut * flicker, 0, 1);
        const outerColors = [
          'rgba(0, 104, 255, 0.92)',
          'rgba(0, 163, 255, 0.9)',
          'rgba(35, 85, 255, 0.88)'
        ];

        context.save();
        context.globalAlpha = particleAlpha;
        context.fillStyle = outerColors[particle.sprite];
        context.shadowColor = 'rgba(0, 134, 255, 1)';
        context.shadowBlur = 13;
        context.beginPath();
        context.moveTo(
          particle.originX + tangentX * baseHalfWidth,
          particle.originY + tangentY * baseHalfWidth
        );
        context.quadraticCurveTo(
          middleX + tangentX * curve,
          middleY + tangentY * curve,
          tipX,
          tipY
        );
        context.quadraticCurveTo(
          middleX - tangentX * curve * 0.35,
          middleY - tangentY * curve * 0.35,
          particle.originX - tangentX * baseHalfWidth,
          particle.originY - tangentY * baseHalfWidth
        );
        context.closePath();
        context.fill();

        const innerTipX = particle.originX + (tipX - particle.originX) * 0.58;
        const innerTipY = particle.originY + (tipY - particle.originY) * 0.58;
        const innerHalfWidth = baseHalfWidth * 0.28;
        context.globalAlpha = particleAlpha * 0.88;
        context.fillStyle = 'rgba(220, 250, 255, 0.96)';
        context.shadowColor = 'rgba(100, 225, 255, 1)';
        context.shadowBlur = 6;
        context.beginPath();
        context.moveTo(
          particle.originX + tangentX * innerHalfWidth,
          particle.originY + tangentY * innerHalfWidth
        );
        context.quadraticCurveTo(middleX, middleY, innerTipX, innerTipY);
        context.quadraticCurveTo(
          middleX - tangentX * innerHalfWidth * 0.5,
          middleY - tangentY * innerHalfWidth * 0.5,
          particle.originX - tangentX * innerHalfWidth,
          particle.originY - tangentY * innerHalfWidth
        );
        context.closePath();
        context.fill();
        context.restore();
        return true;
      });

      context.restore();
    };

    const drawLightning = (deltaTime: number, currentTime: number) => {
      if (currentTime >= nextLightningStrike) {
        const strikeCount = Math.random() < 0.34 ? 2 : 1;

        for (let index = 0; index < strikeCount; index += 1) {
          lightningBolts.push(createLightningBolt(width, height, visibleTop));
        }

        nextLightningStrike = currentTime + randomBetween(190, 720);
      }

      context.save();
      context.globalCompositeOperation = 'lighter';
      context.lineCap = 'round';
      context.lineJoin = 'round';

      lightningBolts = lightningBolts.filter((bolt) => {
        bolt.age += deltaTime;

        if (bolt.age >= bolt.life) {
          return false;
        }

        const flicker = lightningFlicker(bolt.age / bolt.life);

        for (const path of bolt.paths) {
          context.globalAlpha = flicker * 0.3;
          context.strokeStyle = '#ff0000';
          context.lineWidth = 17 * path.strength;
          context.shadowColor = '#ff0000';
          context.shadowBlur = 30;
          traceLightningPath(context, path.points);

          context.globalAlpha = flicker * 0.95;
          context.strokeStyle = '#ff1f2d';
          context.lineWidth = Math.max(1.4, 5 * path.strength);
          context.shadowColor = '#ff1a1a';
          context.shadowBlur = 15;
          traceLightningPath(context, path.points);

          context.globalAlpha = flicker;
          context.strokeStyle = '#fff1f1';
          context.lineWidth = Math.max(0.7, 1.55 * path.strength);
          context.shadowColor = '#ffffff';
          context.shadowBlur = 5;
          traceLightningPath(context, path.points);
        }

        return true;
      });

      context.restore();
    };

    const drawFrame = (currentTime: number) => {
      const deltaTime = Math.min(0.05, Math.max(0, (currentTime - previousTime) / 1000));
      previousTime = currentTime;
      // A display/zoom change can alter pixel density without resizing the element.
      if (getPixelRatio() !== pixelRatio) resizeCanvas();
      clearCanvas();
      // Reapply the exact scale each frame, including fractional-size rounding.
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);

      if (mode === 'blue-fire') {
        drawFire(deltaTime, currentTime);
      } else {
        drawLightning(deltaTime, currentTime);
      }

      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      clearCanvas();
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`profile-animation-layer profile-canvas-animation${mode ? ' is-active' : ''}`}
      data-animation-mode={mode ?? undefined}
      aria-hidden="true"
    />
  );
}
