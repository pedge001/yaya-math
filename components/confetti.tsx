import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF922B", "#CC5DE8", "#20C997", "#F06595",
  "#74C0FC", "#A9E34B",
];

const PARTICLE_COUNT = 60;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  isRect: boolean;
  delay: number;
  duration: number;
  endX: number;
  rotation: number;
}

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: seededRand(i * 7) * SCREEN_WIDTH,
    color: COLORS[Math.floor(seededRand(i * 3) * COLORS.length)],
    size: 6 + seededRand(i * 5) * 8,
    isRect: seededRand(i * 11) > 0.5,
    delay: seededRand(i * 13) * 400,
    duration: 1200 + seededRand(i * 17) * 800,
    endX: (seededRand(i * 19) - 0.5) * 120,
    rotation: seededRand(i * 23) * 720 - 360,
  }));
}

interface ConfettiParticleProps {
  particle: Particle;
  onDone?: () => void;
}

function ConfettiParticle({ particle, onDone }: ConfettiParticleProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(SCREEN_HEIGHT * 0.85, {
          duration: particle.duration,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(SCREEN_HEIGHT * 0.85, { duration: 0 }, (finished) => {
          if (finished && onDone) runOnJS(onDone)();
        })
      )
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.endX, {
        duration: particle.duration,
        easing: Easing.inOut(Easing.sin),
      })
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation, {
        duration: particle.duration,
        easing: Easing.linear,
      })
    );
    // Fade out near the end
    opacity.value = withDelay(
      particle.delay + particle.duration * 0.7,
      withTiming(0, { duration: particle.duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          left: particle.x,
          top: 0,
          width: particle.size,
          height: particle.isRect ? particle.size * 0.5 : particle.size,
          borderRadius: particle.isRect ? 2 : particle.size / 2,
          backgroundColor: particle.color,
        },
      ]}
    />
  );
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const particles = useRef(generateParticles()).current;
  const doneCount = useRef(0);

  if (!active) return null;

  const handleParticleDone = () => {
    doneCount.current += 1;
    if (doneCount.current >= PARTICLE_COUNT && onComplete) {
      onComplete();
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} onDone={handleParticleDone} />
      ))}
    </View>
  );
}
