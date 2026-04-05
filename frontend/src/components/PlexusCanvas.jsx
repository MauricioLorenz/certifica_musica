import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 90
const MAX_DIST = 150
const SPEED = 0.4

export default function PlexusCanvas() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const frameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = canvas.offsetWidth
    let height = canvas.offsetHeight

    const setSize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
    }
    setSize()

    const resizeObserver = new ResizeObserver(setSize)
    resizeObserver.observe(canvas)

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // Create particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: Math.random() * 1.8 + 0.8,
      pulse: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      const mouse = mouseRef.current

      // Update positions
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.pulse += 0.02

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Subtle mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 100 && dist > 0) {
          p.x += (dx / dist) * 0.6
          p.y += (dy / dist) * 0.6
        }
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.35

            // Check proximity to mouse for glow effect
            const midX = (a.x + b.x) / 2
            const midY = (a.y + b.y) / 2
            const mDist = Math.sqrt((midX - mouse.x) ** 2 + (midY - mouse.y) ** 2)
            const mouseBoost = mDist < 120 ? (1 - mDist / 120) * 0.6 : 0

            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(20, 136, 168, ${opacity + mouseBoost})`
            ctx.lineWidth = opacity + mouseBoost > 0.3 ? 1 : 0.5
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const p of particles) {
        const pulse = Math.sin(p.pulse) * 0.5 + 0.5
        const mDist = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2)
        const isNearMouse = mDist < 80

        // Glow
        if (isNearMouse || pulse > 0.85) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(20, 136, 168, ${isNearMouse ? 0.15 : 0.06})`
          ctx.fill()
        }

        // Core dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(20, 136, 168, ${0.5 + pulse * 0.5})`
        ctx.fill()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(frameRef.current)
      resizeObserver.disconnect()
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
