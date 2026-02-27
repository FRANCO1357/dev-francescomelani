import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { LiquidGradientApp, rgbToHex, hexToRgb } from './liquid-gradient-app';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  constructor(private cdr: ChangeDetectorRef) {}
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLElement>;
  @ViewChild('customCursor') customCursor!: ElementRef<HTMLElement>;

  private app: LiquidGradientApp | null = null;
  panelOpen = false;
  activeScheme = 1;
  private cursorX = 0;
  private cursorY = 0;
  private cursorAnimId = 0;

  ngAfterViewInit(): void {
    const el = this.canvasContainer?.nativeElement;
    if (!el) return;
    this.app = new LiquidGradientApp(el);
    this.app.init();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove);
    this.animateCursor();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    cancelAnimationFrame(this.cursorAnimId);
    this.app?.destroy();
    this.app = null;
  }

  private onResize = (): void => {
    this.app?.onResize();
  };

  private onMouseMove = (ev: MouseEvent): void => {
    this.app?.onMouseMove(ev);
    this.cursorX = ev.clientX;
    this.cursorY = ev.clientY;
  };

  private onTouchMove = (ev: TouchEvent): void => {
    if (ev.touches[0]) {
      this.app?.onMouseMove({ clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY } as MouseEvent);
    }
  };

  private animateCursor = (): void => {
    const cursor = this.customCursor?.nativeElement;
    if (cursor) {
      cursor.style.left = this.cursorX + 'px';
      cursor.style.top = this.cursorY + 'px';
    }
    this.cursorAnimId = requestAnimationFrame(this.animateCursor);
  };

  setScheme(scheme: number): void {
    this.activeScheme = scheme;
    this.app?.setColorScheme(scheme);
    this.cdr.detectChanges();
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen) this.cdr.detectChanges();
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  getColorHex(index: number): string {
    if (!this.app) return '#000000';
    const u = this.app.gradientBackground.uniforms[`uColor${index}`] as { value: { x: number; y: number; z: number } };
    if (!u?.value) return '#000000';
    return rgbToHex(u.value.x, u.value.y, u.value.z).toUpperCase();
  }

  onColorPick(index: number, ev: Event): void {
    const hex = (ev.target as HTMLInputElement).value;
    const rgb = hexToRgb(hex);
    if (!this.app || !rgb) return;
    const u = this.app.gradientBackground.uniforms[`uColor${index}`] as { value: { set: (r: number, g: number, b: number) => void } };
    if (u?.value) u.value.set(rgb.r, rgb.g, rgb.b);
  }

  copyColor(index: number): void {
    const hex = this.getColorHex(index);
    navigator.clipboard.writeText(hex).then(() => {
      const btn = document.querySelector(`button[data-copy-btn="${index}"]`) as HTMLButtonElement;
      if (btn) {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  }

  exportAll(): void {
    const colors = [1, 2, 3, 4, 5, 6].map((i) => this.getColorHex(i));
    const text = `Color Scheme:\n${colors.map((c, i) => `Color ${i + 1}: ${c}`).join('\n')}\n\nHex Array: [${colors.map((c) => `"${c}"`).join(', ')}]`;
    navigator.clipboard.writeText(text);
  }
}
