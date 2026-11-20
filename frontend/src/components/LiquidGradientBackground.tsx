import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform vec3 uColor5;
  uniform vec3 uColor6;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform sampler2D uTouchTexture;
  uniform float uGrainIntensity;
  uniform float uZoom;
  uniform vec3 uDarkNavy;
  uniform float uGradientSize;
  uniform float uGradientCount;
  uniform float uColor1Weight;
  uniform float uColor2Weight;

  varying vec2 vUv;

  #define PI 3.14159265359

  // Grain function for film grain effect
  float grain(vec2 uv, float time) {
    vec2 grainUv = uv * uResolution * 0.5;
    float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
    return grainValue * 2.0 - 1.0;
  }

  vec3 getGradientColor(vec2 uv, float time) {
    // Dynamic gradient size based on uniform
    float gradientRadius = uGradientSize;

    // Multiple animated centers with different speeds and patterns
    // Support up to 12 centers for more gradient action
    vec2 center1 = vec2(
      0.5 + sin(time * uSpeed * 0.4) * 0.4,
      0.5 + cos(time * uSpeed * 0.5) * 0.4
    );
    vec2 center2 = vec2(
      0.5 + cos(time * uSpeed * 0.6) * 0.5,
      0.5 + sin(time * uSpeed * 0.45) * 0.5
    );
    vec2 center3 = vec2(
      0.5 + sin(time * uSpeed * 0.35) * 0.45,
      0.5 + cos(time * uSpeed * 0.55) * 0.45
    );
    vec2 center4 = vec2(
      0.5 + cos(time * uSpeed * 0.5) * 0.4,
      0.5 + sin(time * uSpeed * 0.4) * 0.4
    );
    vec2 center5 = vec2(
      0.5 + sin(time * uSpeed * 0.7) * 0.35,
      0.5 + cos(time * uSpeed * 0.6) * 0.35
    );
    vec2 center6 = vec2(
      0.5 + cos(time * uSpeed * 0.45) * 0.5,
      0.5 + sin(time * uSpeed * 0.65) * 0.5
    );

    // Additional centers for more gradient action (7-12)
    vec2 center7 = vec2(
      0.5 + sin(time * uSpeed * 0.55) * 0.38,
      0.5 + cos(time * uSpeed * 0.48) * 0.42
    );
    vec2 center8 = vec2(
      0.5 + cos(time * uSpeed * 0.65) * 0.36,
      0.5 + sin(time * uSpeed * 0.52) * 0.44
    );
    vec2 center9 = vec2(
      0.5 + sin(time * uSpeed * 0.42) * 0.41,
      0.5 + cos(time * uSpeed * 0.58) * 0.39
    );
    vec2 center10 = vec2(
      0.5 + cos(time * uSpeed * 0.48) * 0.37,
      0.5 + sin(time * uSpeed * 0.62) * 0.43
    );
    vec2 center11 = vec2(
      0.5 + sin(time * uSpeed * 0.68) * 0.33,
      0.5 + cos(time * uSpeed * 0.44) * 0.46
    );
    vec2 center12 = vec2(
      0.5 + cos(time * uSpeed * 0.38) * 0.39,
      0.5 + sin(time * uSpeed * 0.56) * 0.41
    );

    float dist1 = length(uv - center1);
    float dist2 = length(uv - center2);
    float dist3 = length(uv - center3);
    float dist4 = length(uv - center4);
    float dist5 = length(uv - center5);
    float dist6 = length(uv - center6);
    float dist7 = length(uv - center7);
    float dist8 = length(uv - center8);
    float dist9 = length(uv - center9);
    float dist10 = length(uv - center10);
    float dist11 = length(uv - center11);
    float dist12 = length(uv - center12);

    // Smaller, tighter influence areas based on uGradientSize
    float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
    float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
    float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
    float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
    float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
    float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
    float influence7 = 1.0 - smoothstep(0.0, gradientRadius, dist7);
    float influence8 = 1.0 - smoothstep(0.0, gradientRadius, dist8);
    float influence9 = 1.0 - smoothstep(0.0, gradientRadius, dist9);
    float influence10 = 1.0 - smoothstep(0.0, gradientRadius, dist10);
    float influence11 = 1.0 - smoothstep(0.0, gradientRadius, dist11);
    float influence12 = 1.0 - smoothstep(0.0, gradientRadius, dist12);

    // Multiple rotation layers for depth
    vec2 rotatedUv1 = uv - 0.5;
    float angle1 = time * uSpeed * 0.15;
    rotatedUv1 = vec2(
      rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
      rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
    );
    rotatedUv1 += 0.5;

    vec2 rotatedUv2 = uv - 0.5;
    float angle2 = -time * uSpeed * 0.12;
    rotatedUv2 = vec2(
      rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
      rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
    );
    rotatedUv2 += 0.5;

    float radialGradient1 = length(rotatedUv1 - 0.5);
    float radialGradient2 = length(rotatedUv2 - 0.5);
    float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, radialGradient1);
    float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);

    // Blend all colors with dynamic intensities - increased for more contrast
    vec3 color = vec3(0.0);
    color += uColor1 * influence1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
    color += uColor2 * influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
    color += uColor3 * influence3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
    color += uColor4 * influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
    color += uColor5 * influence5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
    color += uColor6 * influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;

    // Add extra centers if uGradientCount > 6
    if (uGradientCount > 6.0) {
      color += uColor1 * influence7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
      color += uColor2 * influence8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
      color += uColor3 * influence9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
      color += uColor4 * influence10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
    }
    if (uGradientCount > 10.0) {
      color += uColor5 * influence11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
      color += uColor6 * influence12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
    }

    // Add radial overlays - increased for more contrast, with color weighting
    color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
    color += mix(uColor2, uColor4, radialInfluence2) * 0.4 * uColor2Weight;

    // Clamp and apply intensity
    color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

    // Enhanced color saturation for more vibrant look
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, 1.35);

    color = pow(color, vec3(0.92)); // Slight gamma adjustment for better contrast

    // Ensure minimum brightness (navy blue base instead of grey/black)
    // Use higher threshold to ensure navy blue shows through in low-intensity areas
    float brightness1 = length(color);
    float mixFactor1 = max(brightness1 * 1.2, 0.15); // Higher threshold for navy blue base
    color = mix(uDarkNavy, color, mixFactor1);

    // Cap maximum brightness - increased for more contrast
    float maxBrightness = 1.0;
    float brightness = length(color);
    if (brightness > maxBrightness) {
      color = color * (maxBrightness / brightness);
    }

    return color;
  }

  void main() {
    vec2 uv = vUv;

    // Apply water distortion from touch texture - very strong
    vec4 touchTex = texture2D(uTouchTexture, uv);
    float vx = -(touchTex.r * 2.0 - 1.0);
    float vy = -(touchTex.g * 2.0 - 1.0);
    float intensity = touchTex.b;
    // Much increased distortion strength for very obvious effect
    uv.x += vx * 0.8 * intensity;
    uv.y += vy * 0.8 * intensity;

    // Combined ripple and wave effect for better performance
    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
    float wave = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
    uv += vec2(ripple + wave);

    vec3 color = getGradientColor(uv, uTime);

    // Apply grain effect
    float grainValue = grain(uv, uTime);
    color += grainValue * uGrainIntensity;

    // Subtle color shifting - optimized with single calculation
    float timeShift = uTime * 0.5;
    color.r += sin(timeShift) * 0.02;
    color.g += cos(timeShift * 1.4) * 0.02;
    color.b += sin(timeShift * 1.2) * 0.02;

    // Ensure minimum brightness (navy blue base instead of grey/black)
    // Use higher threshold to ensure navy blue shows through in low-intensity areas
    float brightness2 = length(color);
    float mixFactor2 = max(brightness2 * 1.2, 0.15); // Higher threshold for navy blue base
    color = mix(uDarkNavy, color, mixFactor2);

    // Clamp to valid color range
    color = clamp(color, vec3(0.0), vec3(1.0));

    // Cap maximum brightness - increased for more contrast
    float maxBrightness = 1.0;
    float brightness = length(color);
    if (brightness > maxBrightness) {
      color = color * (maxBrightness / brightness);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

class TouchTexture {
  private readonly size = 64;
  private readonly maxAge = 64;
  private readonly radius: number;
  private readonly speed: number;
  private readonly canvas = document.createElement("canvas");
  private readonly context: CanvasRenderingContext2D | null;
  private readonly points: Array<{
    x: number;
    y: number;
    age: number;
    force: number;
    vx: number;
    vy: number;
  }> = [];
  private last: { x: number; y: number } | null = null;
  readonly texture: THREE.Texture;

  constructor() {
    this.radius = 0.25 * this.size; // Much larger touch radius for more obvious effect
    this.speed = 1 / this.maxAge;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.context = this.canvas.getContext("2d");
    if (this.context) {
      this.context.fillStyle = "black";
      this.context.fillRect(0, 0, this.size, this.size);
    }
    this.texture = new THREE.CanvasTexture(this.canvas);
  }

  addTouch(x: number, y: number) {
    let force = 0;
    let vx = 0;
    let vy = 0;
    if (this.last) {
      const dx = x - this.last.x;
      const dy = y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 20000, 2.0);
    }
    this.last = { x, y };
    this.points.push({ x, y, age: 0, force, vx, vy });
  }

  update() {
    if (!this.context) return;
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.size, this.size);

    for (let i = this.points.length - 1; i >= 0; i--) {
      const point = this.points[i];
      const f = point.force * this.speed * (1 - point.age / this.maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > this.maxAge) {
        this.points.splice(i, 1);
        continue;
      }

      // Draw point
      let intensity = 1;
      if (point.age < this.maxAge * 0.3) {
        intensity = Math.sin(
          (point.age / (this.maxAge * 0.3)) * (Math.PI / 2)
        );
      } else {
        const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
        intensity = -t * (t - 2);
      }
      intensity *= point.force;

      const radius = this.radius;
      const color = `${((point.vx + 1) / 2) * 255}, ${
        ((point.vy + 1) / 2) * 255
      }, ${intensity * 255}`;
      const offset = this.size * 5;
      this.context.shadowOffsetX = offset;
      this.context.shadowOffsetY = offset;
      this.context.shadowBlur = radius * 1;
      this.context.shadowColor = `rgba(${color},${0.2 * intensity})`;

      this.context.beginPath();
      this.context.fillStyle = "rgba(255,0,0,1)";
      const posX = point.x * this.size;
      const posY = (1 - point.y) * this.size;
      this.context.arc(posX - offset, posY - offset, radius, 0, Math.PI * 2);
      this.context.fill();
    }
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}


const LiquidGradientBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      depth: false,
      stencil: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const touchTexture = new TouchTexture();


    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },

        uColor1: { value: new THREE.Vector3(0.596, 0.165, 0.314) }, // 982A50 - Pink
        uColor2: { value: new THREE.Vector3(0.031, 0.043, 0.106) }, // 080B1B - Navy
        uColor3: { value: new THREE.Vector3(0.184, 0.016, 0.016) }, // 2F0404 - Wine
        uColor4: { value: new THREE.Vector3(0.09, 0.027, 0.051) },  // 17070D - Shadow Wine
        uColor5: { value: new THREE.Vector3(0.0, 0.0, 0.0) },       // 000000 - Black
        uColor6: { value: new THREE.Vector3(0.0, 0.0, 0.0) },       // 000000 - Black


        uSpeed: { value: 1.5 },
        uIntensity: { value: 1.8 },
        uTouchTexture: { value: touchTexture.texture },
        uGrainIntensity: { value: 0.08 },
        uZoom: { value: 1.0 },
        uDarkNavy: { value: new THREE.Vector3(0.031, 0.043, 0.106) }, // #080B1B
        uGradientSize: { value: 0.45 },    // Smaller gradient radius for more defined gradients
        uGradientCount: { value: 12.0 },   // More gradient centers (12 instead of 6)
        uColor1Weight: { value: 0.5 },     // Reduce orange intensity
        uColor2Weight: { value: 1.8 },     // Increase navy intensity
      },
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      material.uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    };

    const pointerMove = (event: PointerEvent) => {
      touchTexture.addTouch(
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight
      );
    };

    let frame = 0;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.1);
      material.uniforms.uTime.value += delta;
      previousTime = time;
      touchTexture.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointerMove);
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      mesh.geometry.dispose();
      material.dispose();
      touchTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="liquid-gradient-background"
    />
  );
};

export default LiquidGradientBackground;
