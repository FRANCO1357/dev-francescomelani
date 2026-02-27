import * as THREE from 'three';

export class TouchTexture {
  size = 64;
  width = this.size;
  height = this.size;
  maxAge = 64;
  radius = 0.25 * this.size;
  speed = 1 / this.maxAge;
  trail: Array<{ x: number; y: number; age: number; force: number; vx: number; vy: number }> = [];
  last: { x: number; y: number } | null = null;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  texture!: THREE.Texture;

  constructor() {
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.clear();
    const speed = this.speed;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      const f = point.force * speed * (1 - point.age / this.maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(point);
      }
    }
    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point: { x: number; y: number }) {
    let force = 0, vx = 0, vy = 0;
    const last = this.last;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 20000, 2.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(point: { x: number; y: number; age: number; force: number; vx: number; vy: number }) {
    const pos = { x: point.x * this.width, y: (1 - point.y) * this.height };
    let intensity = point.age < this.maxAge * 0.3
      ? Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2))
      : (() => { const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7); return -t * (t - 2); })();
    intensity *= point.force;
    const radius = this.radius;
    const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = radius * 1;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(255,0,0,1)';
    this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1,uColor2,uColor3,uColor4,uColor5,uColor6;
uniform float uSpeed;
uniform float uIntensity;
uniform sampler2D uTouchTexture;
uniform float uGrainIntensity;
uniform vec3 uDarkNavy;
uniform float uGradientSize;
uniform float uGradientCount;
uniform float uColor1Weight;
uniform float uColor2Weight;
varying vec2 vUv;
#define PI 3.14159265359
float grain(vec2 uv, float time) {
  vec2 grainUv = uv * uResolution * 0.5;
  return (fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0);
}
vec3 getGradientColor(vec2 uv, float time) {
  float gradientRadius = uGradientSize;
  vec2 c1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
  vec2 c2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
  vec2 c3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
  vec2 c4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
  vec2 c5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
  vec2 c6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);
  vec2 c7 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
  vec2 c8 = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
  vec2 c9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
  vec2 c10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
  vec2 c11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
  vec2 c12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);
  float i1=1.0-smoothstep(0.0,gradientRadius,length(uv-c1));
  float i2=1.0-smoothstep(0.0,gradientRadius,length(uv-c2));
  float i3=1.0-smoothstep(0.0,gradientRadius,length(uv-c3));
  float i4=1.0-smoothstep(0.0,gradientRadius,length(uv-c4));
  float i5=1.0-smoothstep(0.0,gradientRadius,length(uv-c5));
  float i6=1.0-smoothstep(0.0,gradientRadius,length(uv-c6));
  float i7=1.0-smoothstep(0.0,gradientRadius,length(uv-c7));
  float i8=1.0-smoothstep(0.0,gradientRadius,length(uv-c8));
  float i9=1.0-smoothstep(0.0,gradientRadius,length(uv-c9));
  float i10=1.0-smoothstep(0.0,gradientRadius,length(uv-c10));
  float i11=1.0-smoothstep(0.0,gradientRadius,length(uv-c11));
  float i12=1.0-smoothstep(0.0,gradientRadius,length(uv-c12));
  vec2 r1=uv-0.5; float a1=time*uSpeed*0.15;
  r1=vec2(r1.x*cos(a1)-r1.y*sin(a1),r1.x*sin(a1)+r1.y*cos(a1)); r1+=0.5;
  vec2 r2=uv-0.5; float a2=-time*uSpeed*0.12;
  r2=vec2(r2.x*cos(a2)-r2.y*sin(a2),r2.x*sin(a2)+r2.y*cos(a2)); r2+=0.5;
  float ri1=1.0-smoothstep(0.0,0.8,length(r1-0.5));
  float ri2=1.0-smoothstep(0.0,0.8,length(r2-0.5));
  vec3 color=vec3(0.0);
  color+=uColor1*i1*(0.55+0.45*sin(time*uSpeed))*uColor1Weight;
  color+=uColor2*i2*(0.55+0.45*cos(time*uSpeed*1.2))*uColor2Weight;
  color+=uColor3*i3*(0.55+0.45*sin(time*uSpeed*0.8))*uColor1Weight;
  color+=uColor4*i4*(0.55+0.45*cos(time*uSpeed*1.3))*uColor2Weight;
  color+=uColor5*i5*(0.55+0.45*sin(time*uSpeed*1.1))*uColor1Weight;
  color+=uColor6*i6*(0.55+0.45*cos(time*uSpeed*0.9))*uColor2Weight;
  if(uGradientCount>6.0){
    color+=uColor1*i7*(0.55+0.45*sin(time*uSpeed*1.4))*uColor1Weight;
    color+=uColor2*i8*(0.55+0.45*cos(time*uSpeed*1.5))*uColor2Weight;
    color+=uColor3*i9*(0.55+0.45*sin(time*uSpeed*1.6))*uColor1Weight;
    color+=uColor4*i10*(0.55+0.45*cos(time*uSpeed*1.7))*uColor2Weight;
  }
  if(uGradientCount>10.0){
    color+=uColor5*i11*(0.55+0.45*sin(time*uSpeed*1.8))*uColor1Weight;
    color+=uColor6*i12*(0.55+0.45*cos(time*uSpeed*1.9))*uColor2Weight;
  }
  color+=mix(uColor1,uColor3,ri1)*0.45*uColor1Weight;
  color+=mix(uColor2,uColor4,ri2)*0.4*uColor2Weight;
  color=clamp(color,vec3(0.0),vec3(1.0))*uIntensity;
  float lum=dot(color,vec3(0.299,0.587,0.114));
  color=mix(vec3(lum),color,1.35);
  color=pow(color,vec3(0.92));
  float b1=length(color);
  color=mix(uDarkNavy,color,max(b1*1.2,0.15));
  if(length(color)>1.0) color=color*(1.0/length(color));
  return color;
}
void main(){
  vec2 uv=vUv;
  vec4 touchTex=texture2D(uTouchTexture,uv);
  float vx=-(touchTex.r*2.0-1.0);
  float vy=-(touchTex.g*2.0-1.0);
  float intensity=touchTex.b;
  uv.x+=vx*0.8*intensity;
  uv.y+=vy*0.8*intensity;
  vec2 center=vec2(0.5);
  float dist=length(uv-center);
  uv+=vec2(sin(dist*20.0-uTime*3.0)*0.04*intensity+sin(dist*15.0-uTime*2.0)*0.03*intensity);
  vec3 color=getGradientColor(uv,uTime);
  color+=grain(uv,uTime)*uGrainIntensity;
  float ts=uTime*0.5;
  color.r+=sin(ts)*0.02;
  color.g+=cos(ts*1.4)*0.02;
  color.b+=sin(ts*1.2)*0.02;
  color=mix(uDarkNavy,color,max(length(color)*1.2,0.15));
  color=clamp(color,vec3(0.0),vec3(1.0));
  if(length(color)>1.0) color=color*(1.0/length(color));
  gl_FragColor=vec4(color,1.0);
}
`;

export class GradientBackground {
  sceneManager: LiquidGradientApp;
  mesh: THREE.Mesh | null = null;
  uniforms: Record<string, { value: unknown }>;

  constructor(sceneManager: LiquidGradientApp) {
    this.sceneManager = sceneManager;
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uSpeed: { value: 1.2 },
      uIntensity: { value: 1.8 },
      uTouchTexture: { value: null as THREE.Texture | null },
      uGrainIntensity: { value: 0.08 },
      uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uGradientSize: { value: 1.0 },
      uGradientCount: { value: 6.0 },
      uColor1Weight: { value: 1.0 },
      uColor2Weight: { value: 1.0 },
    };
  }

  init() {
    const viewSize = this.sceneManager.getViewSize();
    const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms as THREE.ShaderMaterialParameters['uniforms'],
      vertexShader: `
        varying vec2 vUv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.);
          vUv = uv;
        }
      `,
      fragmentShader,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0;
    this.sceneManager.scene.add(this.mesh);
  }

  update(delta: number) {
    (this.uniforms['uTime'] as { value: number }).value += delta;
  }

  onResize(_w: number, _h: number) {
    const viewSize = this.sceneManager.getViewSize();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
    }
    (this.uniforms['uResolution'] as { value: THREE.Vector2 }).value.set(window.innerWidth, window.innerHeight);
  }
}

const COLOR_SCHEMES: Record<number, Record<string, THREE.Vector3>> = {
  1: {
    color1: new THREE.Vector3(0.945, 0.353, 0.133),
    color2: new THREE.Vector3(0.039, 0.055, 0.153),
  },
  2: {
    color1: new THREE.Vector3(1.0, 0.424, 0.314),
    color2: new THREE.Vector3(0.251, 0.878, 0.816),
  },
  3: {
    color1: new THREE.Vector3(0.945, 0.353, 0.133),
    color2: new THREE.Vector3(0.039, 0.055, 0.153),
    color3: new THREE.Vector3(0.251, 0.878, 0.816),
  },
  4: {
    color1: new THREE.Vector3(0.949, 0.4, 0.2),
    color2: new THREE.Vector3(0.176, 0.42, 0.427),
    color3: new THREE.Vector3(0.82, 0.686, 0.612),
  },
  5: {
    color1: new THREE.Vector3(0.945, 0.353, 0.133),
    color2: new THREE.Vector3(0.0, 0.259, 0.22),
    color3: new THREE.Vector3(0.945, 0.353, 0.133),
    color4: new THREE.Vector3(0.0, 0.0, 0.0),
    color5: new THREE.Vector3(0.945, 0.353, 0.133),
    color6: new THREE.Vector3(0.0, 0.0, 0.0),
  },
};

export class LiquidGradientApp {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  clock: THREE.Clock;
  touchTexture: TouchTexture;
  gradientBackground: GradientBackground;
  currentScheme = 1;
  mouse?: { x: number; y: number };
  private container: HTMLElement;
  private animId = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false, depth: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.id = 'webGLApp';
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);
    this.clock = new THREE.Clock();
    this.touchTexture = new TouchTexture();
    this.gradientBackground = new GradientBackground(this);
    (this.gradientBackground.uniforms['uTouchTexture'] as { value: THREE.Texture }).value = this.touchTexture.texture;
  }

  setColorScheme(scheme: number) {
    const colors = COLOR_SCHEMES[scheme];
    if (!colors) return;
    this.currentScheme = scheme;
    const u = this.gradientBackground.uniforms;

    const copy = (name: string, i: number) => {
      const v = u[`uColor${i}`] as { value: THREE.Vector3 };
      if (v && colors[name]) v.value.copy(colors[name] as THREE.Vector3);
    };

    if (scheme === 3) {
      copy('color1', 1); copy('color2', 2); copy('color3', 3);
      copy('color1', 4); copy('color2', 5); copy('color3', 6);
    } else if (scheme === 4) {
      copy('color1', 1); copy('color2', 2); copy('color3', 3);
      copy('color1', 4); copy('color2', 5); copy('color3', 6);
    } else if (scheme === 5) {
      copy('color1', 1); copy('color2', 2); copy('color3', 3);
      copy('color4', 4); copy('color5', 5); copy('color6', 6);
    } else {
      copy('color1', 1); copy('color2', 2); copy('color1', 3);
      copy('color2', 4); copy('color1', 5); copy('color2', 6);
    }

    if (scheme === 1 || scheme === 5) {
      this.scene.background = new THREE.Color(0x0a0e27);
      (u['uDarkNavy'] as { value: THREE.Vector3 }).value.set(0.039, 0.055, 0.153);
      (u['uGradientSize'] as { value: number }).value = 0.45;
      (u['uGradientCount'] as { value: number }).value = 12;
      (u['uSpeed'] as { value: number }).value = 1.5;
      (u['uColor1Weight'] as { value: number }).value = 0.5;
      (u['uColor2Weight'] as { value: number }).value = 1.8;
    } else if (scheme === 4) {
      this.scene.background = new THREE.Color(0xffffff);
      (u['uDarkNavy'] as { value: THREE.Vector3 }).value.set(0, 0, 0);
    } else {
      this.scene.background = new THREE.Color(0x0a0e27);
      (u['uDarkNavy'] as { value: THREE.Vector3 }).value.set(0.039, 0.055, 0.153);
      (u['uGradientSize'] as { value: number }).value = 1.0;
      (u['uGradientCount'] as { value: number }).value = 6.0;
      (u['uSpeed'] as { value: number }).value = 1.2;
      (u['uColor1Weight'] as { value: number }).value = 1.0;
      (u['uColor2Weight'] as { value: number }).value = 1.0;
    }
  }

  init() {
    this.gradientBackground.init();
    this.setColorScheme(1);
    this.render();
    this.tick();
  }

  onMouseMove(ev: MouseEvent) {
    this.mouse = { x: ev.clientX / window.innerWidth, y: 1 - ev.clientY / window.innerHeight };
    this.touchTexture.addTouch(this.mouse);
  }

  getViewSize() {
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(this.camera.position.z * Math.tan(fovRad / 2) * 2);
    return { width: height * this.camera.aspect, height };
  }

  private update(delta: number) {
    this.touchTexture.update();
    this.gradientBackground.update(delta);
  }

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  tick = () => {
    this.render();
    this.animId = requestAnimationFrame(this.tick);
  };

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.gradientBackground.onResize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => { const hex = Math.round(n * 255).toString(16); return hex.length === 1 ? '0' + hex : hex; };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 } : null;
}
