'use client'

import { useEffect, useRef } from 'react'

const PIXEL_SIZE = 3
const R = 6 // physics half-size (px) - shapes are 12×15px

const MAX_SHAPES = 1000 // oldest shapes removed when exceeded
const BATCH_MIN = 5 // minimum shapes spawned per click
const BATCH_MAX = 40 // maximum shapes spawned per click

const BLAST_RADIUS = 160 // px - how far from a click shapes are affected
const BLAST_STRENGTH = 18 // impulse magnitude at the epicenter

// Resize - how much shapes react when the browser window is resized
const RESIZE_STRENGTH = 0.05 // multiplier on viewport delta (lower = gentler)
const RESIZE_CAP = 3 // max velocity impulse per frame from resizing

// Window move - how much shapes react when the OS window is dragged
const MOVE_STRENGTH = 0.08 // multiplier on screen position delta (lower = gentler)
const MOVE_CAP = 18 // max velocity impulse per frame from window moving

// Letter sprites: 4 cols × 5 rows meta-pixels → 12×15px
const LETTER_COLS = 4
const LETTER_ROWS = 5
const LETTER_W = LETTER_COLS * PIXEL_SIZE // 12px
const LETTER_H = LETTER_ROWS * PIXEL_SIZE // 15px

type ShapeKind = 'A' | 'R' | 'O' | 'N' | 'F' | 'D'

const COLORS = [
  '#d4aa38',
  '#27a8aa',
  '#d46e88',
  '#5d9ae5',
  '#5aaa6e',
  '#d4653c',
  '#b576ed',
  '#e0dbd0',
]

const KINDS: ShapeKind[] = [
  'A',
  'A',
  'R',
  'O',
  'N',
  'F',
  'O',
  'R',
  'D',
  'O',
  'O',
  'O',
]

// Row-major pixel maps - 4 cols × 5 rows (1 = filled)
// prettier-ignore
const LETTER_PIXELS: Record<ShapeKind, number[]> = {
  A: [0,1,1,0,
      1,0,0,1,
      1,1,1,1,
      1,0,0,1,
      1,0,0,1],
  R: [1,1,1,0,
      1,0,0,1,
      1,1,1,0,
      1,0,1,0,
      1,0,0,1],
  O: [0,1,1,0,
      1,0,0,1,
      1,0,0,1,
      1,0,0,1,
      0,1,1,0],
  N: [1,0,0,1,
      1,1,0,1,
      1,0,1,1,
      1,0,0,1,
      1,0,0,1],
  F: [1,1,1,1,
      1,0,0,0,
      1,1,1,0,
      1,0,0,0,
      1,0,0,0],
  D: [1,1,1,0,
      1,0,0,1,
      1,0,0,1,
      1,0,0,1,
      1,1,1,0],
}

export interface PixelPhysicsCtrl {
  spawnBatch: () => void
  shake: () => void
}

interface Props {
  sectionEl: HTMLElement | null
  onReady: (ctrl: PixelPhysicsCtrl) => void
}

export default function PixelPhysics({ sectionEl, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let animId: number
    let cleanup: (() => void) | undefined
    ;(async () => {
      const Matter = await import('matter-js')
      if (cancelled) return

      const { Engine, Bodies, Body, Composite, Sleeping } = Matter

      const engine = Engine.create({
        gravity: { x: 0, y: 2, scale: 0.001 },
        positionIterations: 10,
        velocityIterations: 8,
        constraintIterations: 4,
        enableSleeping: true,
      })

      let W = window.innerWidth
      let H = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      // Build sprites at physical pixel resolution to avoid Safari's HiDPI blur
      function buildSprite(pixels: number[], color: string) {
        const c = document.createElement('canvas')
        c.width = LETTER_W * dpr
        c.height = LETTER_H * dpr
        const sc = c.getContext('2d')!
        sc.fillStyle = color
        for (let row = 0; row < LETTER_ROWS; row++) {
          for (let col = 0; col < LETTER_COLS; col++) {
            if (pixels[row * LETTER_COLS + col]) {
              sc.fillRect(
                col * PIXEL_SIZE * dpr,
                row * PIXEL_SIZE * dpr,
                PIXEL_SIZE * dpr,
                PIXEL_SIZE * dpr
              )
            }
          }
        }
        return c
      }
      const sprites: Record<string, HTMLCanvasElement> = {}
      for (const k of Object.keys(LETTER_PIXELS) as ShapeKind[])
        for (const color of COLORS)
          sprites[`${k}:${color}`] = buildSprite(LETTER_PIXELS[k], color)
      const halfW = (LETTER_W / 2) * dpr
      const halfH = (LETTER_H / 2) * dpr

      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      const ctx = canvas.getContext('2d')!

      // Static boundaries
      const wallOpts = { isStatic: true, restitution: 0.4, friction: 0.3 }
      const floor = Bodies.rectangle(W / 2, H + 25, W * 3, 50, wallOpts)
      const leftWall = Bodies.rectangle(-25, H / 2, 50, H * 3, wallOpts)
      const rightWall = Bodies.rectangle(W + 25, H / 2, 50, H * 3, wallOpts)

      const getRect = () =>
        sectionEl?.getBoundingClientRect() ??
        new DOMRect(W / 2 - 100, H / 2 - 100, 200, 200)

      let sectionRect = getRect()
      const sectionBody = Bodies.rectangle(
        sectionRect.left + sectionRect.width / 2,
        sectionRect.top + sectionRect.height / 2,
        sectionRect.width,
        sectionRect.height,
        { isStatic: true, restitution: 0.4, friction: 0.3, label: 'section' }
      )

      Composite.add(engine.world, [floor, leftWall, rightWall, sectionBody])

      // Ordered oldest-first so we can trim from the front
      interface ShapeEntry {
        body: Matter.Body
        kind: ShapeKind
        color: string
      }
      const shapes: ShapeEntry[] = []

      const bodyOpts = {
        restitution: 0.5,
        friction: 0.3,
        frictionAir: 0.008,
        density: 0.005,
        sleepThreshold: 60,
      }

      function removeOldest(count: number) {
        const removed = shapes.splice(0, count)
        for (const { body } of removed) Composite.remove(engine.world, body)
        for (const { body } of shapes) Sleeping.set(body, false)
      }

      function spawnBatch() {
        const batchSize =
          BATCH_MIN + Math.floor(Math.random() * (BATCH_MAX - BATCH_MIN + 1))
        const rect = getRect()
        const xMin = rect.left - 60
        const xMax = rect.right + 60
        const startY = -R - Math.random() * 20
        for (let i = 0; i < batchSize; i++) {
          const x = xMin + Math.random() * (xMax - xMin)
          const y = startY - i * (R * 2 + 4) - Math.random() * 20
          const kind = KINDS[Math.floor(Math.random() * KINDS.length)]
          const color = COLORS[Math.floor(Math.random() * COLORS.length)]
          const body = Bodies.rectangle(x, y, LETTER_W, LETTER_H, bodyOpts)
          Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 0 })
          shapes.push({ body, kind, color })
          Composite.add(engine.world, body)
        }
        // Trim oldest if over limit
        if (shapes.length > MAX_SHAPES) removeOldest(shapes.length - MAX_SHAPES)
      }

      function shake() {
        // Jolt shapes near/on the section element
        const sign = Math.random() > 0.5 ? 1 : -1
        for (const { body } of shapes) {
          const { x, y } = body.position
          if (
            x > sectionRect.left - R * 3 &&
            x < sectionRect.right + R * 3 &&
            y > sectionRect.top - R * 5 &&
            y < sectionRect.bottom + R
          ) {
            Sleeping.set(body, false)
            Body.setVelocity(body, {
              x: body.velocity.x + sign * (2 + Math.random() * 3),
              y: body.velocity.y - Math.random() * 1.2,
            })
          }
        }
      }

      function blast(cx: number, cy: number) {
        // Radial impulse from click point, falling off linearly with distance
        for (const { body } of shapes) {
          const { x, y } = body.position
          const dx = x - cx
          const dy = y - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > BLAST_RADIUS || dist === 0) continue
          const mag = BLAST_STRENGTH * (1 - dist / BLAST_RADIUS)
          Sleeping.set(body, false)
          Body.setVelocity(body, {
            x: body.velocity.x + (dx / dist) * mag,
            y: body.velocity.y + (dy / dist) * mag,
          })
        }
      }

      // Listen on window so the canvas can stay pointer-events-none
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Element | null
        if (target?.closest('#close')) return
        blast(e.clientX, e.clientY)
      }
      window.addEventListener('pointerdown', onPointerDown)

      onReadyRef.current({ spawnBatch, shake })
      spawnBatch()

      // Window-move polling state
      let prevScreenX = window.screenX
      let prevScreenY = window.screenY
      let lastTime = performance.now()

      const loop = (now: number) => {
        if (cancelled) return
        animId = requestAnimationFrame(loop)

        const delta = Math.min(now - lastTime, 32)
        lastTime = now

        // Read screen position every frame - needed for both resize edge detection
        // and window-move inertia
        const sx = window.screenX
        const sy = window.screenY
        const dsx = sx - prevScreenX // >0 = window/left-edge moved right
        const dsy = sy - prevScreenY // >0 = window/top-edge moved down
        prevScreenX = sx
        prevScreenY = sy

        // Sync boundaries every frame - catches rapid resize without event lag
        const newW = window.innerWidth
        const newH = window.innerHeight
        const didResize = newW !== W || newH !== H
        if (didResize) {
          const prevW = W
          const prevH = H
          W = newW
          H = newH
          canvas.width = W * dpr
          canvas.height = H * dpr
          canvas.style.width = `${W}px`
          canvas.style.height = `${H}px`

          Body.setPosition(floor, { x: W / 2, y: H + 25 })
          Body.setPosition(leftWall, { x: -25, y: H / 2 })
          Body.setPosition(rightWall, { x: W + 25, y: H / 2 })

          sectionRect = getRect()
          Body.setPosition(sectionBody, {
            x: sectionRect.left + sectionRect.width / 2,
            y: sectionRect.top + sectionRect.height / 2,
          })

          // Determine how far each edge moved:
          // right edge delta = screenX delta + width delta; <0 = swept left
          // bottom edge delta = screenY delta + height delta; <0 = swept up
          const dW = W - prevW
          const dH = H - prevH
          const rightEdgeDelta = dsx + dW
          const bottomEdgeDelta = dsy + dH
          const edgeZone = R * 8

          for (const { body } of shapes) {
            // Wake everything - boundaries and section may have shifted
            Sleeping.set(body, false)

            const { x, y } = body.position
            let vx = body.velocity.x
            let vy = body.velocity.y

            // Right edge swept left - push shapes near x=W leftward
            if (rightEdgeDelta < 0 && x > W - edgeZone) {
              const proximity = Math.max(0, 1 - (W - x) / edgeZone)
              vx -= Math.min(
                RESIZE_CAP,
                Math.abs(rightEdgeDelta) * RESIZE_STRENGTH * (1 + proximity)
              )
            }
            // Bottom edge swept up - push shapes near y=H upward
            if (bottomEdgeDelta < 0 && y > H - edgeZone) {
              const proximity = Math.max(0, 1 - (H - y) / edgeZone)
              vy -= Math.min(
                RESIZE_CAP,
                Math.abs(bottomEdgeDelta) * RESIZE_STRENGTH * (1 + proximity)
              )
            }

            // Clamp any shape that escaped outside the new viewport
            const clampedX = Math.max(R, Math.min(W - R, x))
            const clampedY = Math.min(H - R, y)
            if (clampedX !== x || clampedY !== y) {
              Body.setPosition(body, { x: clampedX, y: clampedY })
            }
            Body.setVelocity(body, { x: vx, y: vy })
          }
        } else if (dsx !== 0 || dsy !== 0) {
          // Window-move inertia - only when not resizing to avoid double impulse
          const nx = Math.max(
            -MOVE_CAP,
            Math.min(MOVE_CAP, -dsx * MOVE_STRENGTH)
          )
          const ny = Math.max(
            -MOVE_CAP,
            Math.min(MOVE_CAP, -dsy * MOVE_STRENGTH)
          )
          for (const { body } of shapes) {
            Sleeping.set(body, false)
            Body.setVelocity(body, {
              x: body.velocity.x + nx,
              y: body.velocity.y + ny,
            })
          }
        }

        // Run multiple sub-steps per frame to reduce overlap under heavy stacking
        Engine.update(engine, delta / 3)
        Engine.update(engine, delta / 3)
        Engine.update(engine, delta / 3)

        ctx.clearRect(0, 0, W * dpr, H * dpr)

        for (const { body, kind, color } of shapes) {
          const spr = sprites[`${kind}:${color}`]
          const { x, y } = body.position
          ctx.save()
          ctx.translate(Math.round(x * dpr), Math.round(y * dpr))
          ctx.rotate(body.angle)
          ctx.drawImage(spr, -halfW, -halfH)
          ctx.restore()
        }
      }

      animId = requestAnimationFrame(loop)

      cleanup = () => {
        cancelled = true
        cancelAnimationFrame(animId)
        window.removeEventListener('pointerdown', onPointerDown)
      }
    })()

    return () => cleanup?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  )
}
