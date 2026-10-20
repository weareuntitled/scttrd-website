// Fisheye Infinite Grid — WebGL-Port des Componentry-Components
// (https://componentry.dev/docs/components/fisheye-infinite-grid), ohne React/Tailwind.
// Gleiche Shader-Mathematik, gleiche Parameter, gleiche Physik.

export interface FisheyeGridItem {
  image: string;
  alt: string;
  title?: string;
  meta?: string;
}

export interface FisheyeGridOptions {
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  lensStrength?: number;
  hoverNudge?: number;
  inertia?: number;
  wheelSensitivity?: number;
  theme?: 'dark' | 'light';
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform vec2 u_atlas_size;
  uniform vec2 u_offset;
  uniform float u_curvature;
  varying vec2 v_uv;

  void main() {
    vec2 centered = v_uv * 2.0 - 1.0;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 lens = vec2(centered.x * aspect, centered.y);
    float radius = dot(lens, lens) / (aspect * aspect + 1.0);
    float curve = u_curvature * (0.34 * radius + 0.12 * radius * radius);
    vec2 warped = lens / (1.0 + curve);
    vec2 warped_uv = vec2(warped.x / aspect, warped.y) * 0.5 + 0.5;
    vec2 world = vec2(
      warped_uv.x * u_resolution.x - u_offset.x,
      (1.0 - warped_uv.y) * u_resolution.y - u_offset.y
    );
    vec2 atlas_uv = fract(world / u_atlas_size);
    vec4 color = texture2D(u_texture, vec2(atlas_uv.x, 1.0 - atlas_uv.y));
    float edgeShade = clamp(radius * u_curvature * 0.12, 0.0, 0.24);
    color.rgb *= 1.0 - edgeShade;
    gl_FragColor = color;
  }
`;

const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (gl: WebGLRenderingContext) => {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
};

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
};

export function initFisheyeGrid(root: HTMLElement, items: FisheyeGridItem[], options: FisheyeGridOptions = {}) {
  const {
    tileWidth = 238,
    tileHeight = 272,
    gap = 0,
    lensStrength = 0.24,
    hoverNudge = 16,
    inertia = 0.94,
    wheelSensitivity = 0.42,
    theme = 'dark',
  } = options;
  if (!items.length) return;

  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' });
  if (!gl) return;
  const program = createProgram(gl);
  if (!program) return;

  const positionBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!positionBuffer || !texture) return;

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const atlasSizeLocation = gl.getUniformLocation(program, 'u_atlas_size');
  const offsetLocation = gl.getUniformLocation(program, 'u_offset');
  const curvatureLocation = gl.getUniformLocation(program, 'u_curvature');
  const textureLocation = gl.getUniformLocation(program, 'u_texture');

  const safeTileWidth = Math.max(140, tileWidth);
  const safeTileHeight = Math.max(150, tileHeight);
  const safeGap = Math.max(0, gap);
  const cellWidth = safeTileWidth + safeGap;
  const cellHeight = safeTileHeight + safeGap;
  const atlasColumns = Math.max(2, Math.min(4, items.length));
  const atlasRows = Math.max(2, Math.ceil(items.length / atlasColumns));
  const atlas = document.createElement('canvas');
  atlas.width = Math.ceil(atlasColumns * cellWidth);
  atlas.height = Math.ceil(atlasRows * cellHeight);
  const atlasContext = atlas.getContext('2d');
  if (!atlasContext) return;

  const loadedImages: Array<HTMLImageElement | null> = Array.from({ length: items.length }, () => null);
  let disposed = false;
  let animationFrame = 0;
  let previousFrame = performance.now();
  let viewWidth = 1;
  let viewHeight = 1;

  const position = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  const drag = { active: false, pointerId: -1, x: 0, y: 0, time: 0 };
  let nudge: { startedAt: number; x: number; y: number } | null = null;
  let reducedMotion = false;

  const uploadAtlas = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  };

  const TYPE_TILES = ['SCTTRD', 'LIVE', 'AUGSBURG', '2026', 'BRUTAL ABER SCHÖN', 'POST PUNK TECHNO TRANCE'];

  const drawTypeTile = (index: number, x: number, y: number) => {
    const light = theme === 'light';
    const red = index % 2 === 0;
    const text = TYPE_TILES[Math.floor(index / 5) % TYPE_TILES.length];
    const vertical = text.length <= 12;
    const fontSize = vertical ? Math.max(14, Math.round(safeTileWidth * 0.14)) : Math.max(11, Math.round(safeTileWidth * 0.09));

    atlasContext.fillStyle = light ? '#f1efe9' : red ? '#f00000' : '#0c0c0c';
    atlasContext.fillRect(x, y, safeTileWidth, safeTileHeight);
    atlasContext.strokeStyle = light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
    atlasContext.lineWidth = 1;
    atlasContext.strokeRect(x + 0.5, y + 0.5, safeTileWidth - 1, safeTileHeight - 1);

    atlasContext.save();
    atlasContext.translate(x + safeTileWidth / 2, y + safeTileHeight / 2);
    if (vertical) atlasContext.rotate(-Math.PI / 2);
    atlasContext.fillStyle = light ? '#0c0c0c' : red ? '#0c0c0c' : '#f00000';
    atlasContext.font = `800 ${fontSize}px Poppins, sans-serif`;
    atlasContext.textAlign = 'center';
    atlasContext.textBaseline = 'middle';
    atlasContext.fillText(text, 0, 0, safeTileWidth - 20);
    atlasContext.restore();

    atlasContext.fillStyle = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)';
    atlasContext.font = `600 ${Math.max(8, Math.round(safeTileWidth * 0.038))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    atlasContext.textAlign = 'left';
    atlasContext.textBaseline = 'middle';
    atlasContext.fillText(String(index + 1).padStart(2, '0'), x + 12, y + safeTileHeight - 18);
  };

  const drawAtlas = () => {
    const light = theme === 'light';
    atlasContext.fillStyle = light ? '#f1efe9' : '#060606';
    atlasContext.fillRect(0, 0, atlas.width, atlas.height);
    atlasContext.textBaseline = 'middle';

    for (let index = 0; index < atlasColumns * atlasRows; index += 1) {
      const item = items[index % items.length];
      const image = loadedImages[index % items.length];
      const column = index % atlasColumns;
      const row = Math.floor(index / atlasColumns);
      const x = column * cellWidth;
      const y = row * cellHeight;
      const inset = Math.max(12, Math.round(safeTileWidth * 0.07));
      const footerHeight = Math.max(32, Math.round(safeTileHeight * 0.14));
      const imageWidth = safeTileWidth - inset * 2;
      const imageHeight = safeTileHeight - inset * 2 - footerHeight;

      // Jede fuenfte Kachel ist eine typografische Kachel — das bringt Rhythmus in die Wand.
      if (index % 5 === 3) {
        drawTypeTile(index, x, y);
        continue;
      }

      atlasContext.fillStyle = light ? '#f8f6f0' : '#080808';
      atlasContext.fillRect(x, y, safeTileWidth, safeTileHeight);
      atlasContext.strokeStyle = light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.09)';
      atlasContext.lineWidth = 1;
      atlasContext.beginPath();
      atlasContext.moveTo(x + 0.5, y);
      atlasContext.lineTo(x + 0.5, y + safeTileHeight);
      atlasContext.moveTo(x, y + 0.5);
      atlasContext.lineTo(x + safeTileWidth, y + 0.5);
      atlasContext.stroke();

      atlasContext.fillStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.035)';
      atlasContext.fillRect(x + inset, y + inset, imageWidth, imageHeight);
      if (image?.complete && image.naturalWidth > 0) {
        drawCoverImage(atlasContext, image, x + inset, y + inset, imageWidth, imageHeight);
        atlasContext.fillStyle = light ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.22)';
        atlasContext.fillRect(x + inset, y + inset, imageWidth, imageHeight);
      }

      atlasContext.strokeStyle = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
      atlasContext.strokeRect(x + inset + 0.5, y + inset + 0.5, imageWidth - 1, imageHeight - 1);

      const labelY = y + safeTileHeight - inset - footerHeight / 2 + 5;
      const fontSize = Math.max(8, Math.round(safeTileWidth * 0.038));
      atlasContext.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      atlasContext.fillStyle = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.48)';
      const title = (item.title ?? item.alt).toUpperCase();
      atlasContext.fillText(title.length > 18 ? `${title.slice(0, 17)}…` : title, x + inset, labelY);
      if (item.meta) {
        atlasContext.textAlign = 'right';
        atlasContext.fillText(item.meta, x + safeTileWidth - inset, labelY);
        atlasContext.textAlign = 'left';
      }
    }
    uploadAtlas();
  };

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => { reducedMotion = motionQuery.matches; };
  syncMotion();
  motionQuery.addEventListener('change', syncMotion);

  const safeInertia = clamp(inertia, 0, 0.98);

  const currentNudge = (time: number) => {
    if (!nudge) return { x: 0, y: 0, active: false };
    const elapsed = Math.max(0, time - nudge.startedAt);
    const progress = clamp(elapsed / 520, 0, 1);
    const settled = 1 - Math.pow(1 - progress, 3);
    const breathing = 1 + Math.sin(elapsed * 0.0042) * 0.07;
    const amount = settled * breathing;
    return { x: nudge.x * amount, y: nudge.y * amount, active: true };
  };

  const renderGrid = (time: number) => {
    const current = currentNudge(time);
    gl.useProgram(program);
    gl.uniform2f(resolutionLocation, viewWidth, viewHeight);
    gl.uniform2f(atlasSizeLocation, atlas.width, atlas.height);
    gl.uniform2f(offsetLocation, position.x + current.x, position.y + current.y);
    gl.uniform1f(curvatureLocation, clamp(lensStrength, 0, 2.5));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocation, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return current.active;
  };

  const tick = (time: number) => {
    const delta = Math.min(32, time - previousFrame);
    previousFrame = time;
    if (!drag.active && !reducedMotion) {
      position.x += velocity.x * delta;
      position.y += velocity.y * delta;
      const decay = Math.pow(safeInertia, delta / 16.667);
      velocity.x *= decay;
      velocity.y *= decay;
    } else if (!drag.active) {
      velocity.x = 0;
      velocity.y = 0;
    }
    const nudgeActive = renderGrid(time);
    const moving = Math.hypot(velocity.x, velocity.y) > 0.006;
    if (drag.active || moving || nudgeActive) animationFrame = requestAnimationFrame(tick);
    else animationFrame = 0;
  };

  const requestRender = () => {
    if (animationFrame) return;
    previousFrame = performance.now();
    animationFrame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const rect = root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewWidth = Math.max(1, rect.width);
    viewHeight = Math.max(1, rect.height);
    canvas.width = Math.max(1, Math.round(viewWidth * dpr));
    canvas.height = Math.max(1, Math.round(viewHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    requestRender();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();

  items.forEach((item, index) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { if (disposed) return; loadedImages[index] = image; drawAtlas(); requestRender(); };
    image.onerror = () => { if (disposed) return; drawAtlas(); requestRender(); };
    image.src = item.image;
  });
  drawAtlas();

  const commitNudge = (time: number) => {
    const current = currentNudge(time);
    if (!nudge && !current.active) return;
    position.x += current.x;
    position.y += current.y;
    nudge = null;
  };

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.buttons !== 0 || reducedMotion || drag.active || hoverNudge <= 0) return;
    const rect = root.getBoundingClientRect();
    const fromLeft = event.clientX < rect.left + rect.width / 2;
    const fromTop = event.clientY < rect.top + rect.height / 2;
    nudge = {
      startedAt: performance.now(),
      x: (fromLeft ? 1 : -1) * hoverNudge,
      y: (fromTop ? 1 : -1) * hoverNudge * 0.42,
    };
    requestRender();
  };

  const onPointerLeave = () => {
    if (drag.active) return;
    commitNudge(performance.now());
    requestRender();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    commitNudge(performance.now());
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = performance.now();
    velocity.x = 0;
    velocity.y = 0;
    root.dataset.dragging = 'true';
    root.setPointerCapture(event.pointerId);
    requestRender();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const bounds = root.getBoundingClientRect();
    if (event.clientX <= bounds.left || event.clientY <= bounds.top || event.clientX >= bounds.right || event.clientY >= bounds.bottom) {
      drag.active = false;
      root.dataset.dragging = 'false';
      if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
      requestRender();
      return;
    }
    const time = performance.now();
    const deltaTime = Math.max(8, time - drag.time);
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    position.x += deltaX;
    position.y += deltaY;
    velocity.x = clamp(deltaX / deltaTime, -2.4, 2.4);
    velocity.y = clamp(deltaY / deltaTime, -2.4, 2.4);
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = time;
    requestRender();
  };

  const endDrag = (event: PointerEvent) => {
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    drag.active = false;
    root.dataset.dragging = 'false';
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    requestRender();
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    position.x += event.deltaX * wheelSensitivity * 2;
    position.y += event.deltaY * wheelSensitivity * 2;
    requestRender();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [42, 0], ArrowRight: [-42, 0], ArrowUp: [0, 42], ArrowDown: [0, -42],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    commitNudge(performance.now());
    position.x += direction[0];
    position.y += direction[1];
    requestRender();
  };

  root.addEventListener('pointerenter', onPointerEnter);
  root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('keydown', onKeyDown);

  return () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    observer.disconnect();
    motionQuery.removeEventListener('change', syncMotion);
  };
}
