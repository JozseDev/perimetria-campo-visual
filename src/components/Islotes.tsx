import { useEffect, useRef } from 'react'

interface Props {
  respuestas: any[]
  width?: number
  height?: number
}

export default function Islotes({ respuestas, width = 600, height = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // ============================================
    // 1. RETÍCULA EN GRADOS (IGUAL QUE EL EXAMEN)
    // ============================================
    const cx = 300
    const cy = 300
    const PX_POR_GRADO = 3.5
    const gradosMax = 70

    // Círculos concéntricos (10° a 70°)
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 0.5
    const grados = [10, 20, 30, 40, 50, 60, 70]
    grados.forEach(g => {
      const r = g * PX_POR_GRADO
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
      
      // Etiqueta de grados
      ctx.fillStyle = '#999'
      ctx.font = '10px Arial'
      ctx.fillText(`${g}°`, cx + r - 15, cy - 5)
    })

    // Líneas radiales cada 30°
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 0.5
    for (let ang = 0; ang < 360; ang += 30) {
      const rad = (ang * Math.PI) / 180
      const x = cx + Math.cos(rad) * (gradosMax * PX_POR_GRADO)
      const y = cy + Math.sin(rad) * (gradosMax * PX_POR_GRADO)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.stroke()
      
      // Etiqueta de ángulos
      ctx.fillStyle = '#999'
      ctx.font = '10px Arial'
      ctx.fillText(`${ang}°`, x + 5, y - 5)
    }

    // Punto de fijación
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
    ctx.fill()

    // ============================================
    // 2. DIBUJAR PUNTOS (VISTOS/NO VISTOS)
    // ============================================
    if (respuestas.length > 0) {
      // Filtrar respuestas con grado (para compatibilidad)
      const respuestasConGrado = respuestas.map(r => ({
        ...r,
        grado: r.grado || Math.round(r.distancia / PX_POR_GRADO)
      }))

      const puntosVistos = respuestasConGrado.filter(r => r.visto === true)
      const puntosNoVistos = respuestasConGrado.filter(r => r.visto === false)

      // Puntos VISTOS (verde)
      puntosVistos.forEach(r => {
        const rad = (r.angulo * Math.PI) / 180
        const x = cx + Math.cos(rad) * (r.grado * PX_POR_GRADO)
        const y = cy + Math.sin(rad) * (r.grado * PX_POR_GRADO)
        
        ctx.fillStyle = '#00aa00'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = 'black'
        ctx.font = '10px Arial'
        ctx.fillText('✓', x - 3, y - 8)
      })

      // Puntos NO VISTOS (rojo)
      puntosNoVistos.forEach(r => {
        const rad = (r.angulo * Math.PI) / 180
        const x = cx + Math.cos(rad) * (r.grado * PX_POR_GRADO)
        const y = cy + Math.sin(rad) * (r.grado * PX_POR_GRADO)
        
        ctx.fillStyle = '#ff3333'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = 'black'
        ctx.font = '10px Arial'
        ctx.fillText('✗', x - 3, y - 8)
      })

      // ============================================
      // 3. ISOPTERA (LÍNEA NEGRA, NO ÁREA AZUL)
      // ============================================
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3]) // Línea punteada como Goldmann
      
      const angulosUnicos = [...new Set(respuestas.map(r => r.angulo))].sort((a,b) => a - b)
      
      ctx.beginPath()
      let primero = true
      
      angulosUnicos.forEach(angulo => {
        const vistasEnAngulo = respuestasConGrado
          .filter(r => r.angulo === angulo && r.visto === true)
        
        if (vistasEnAngulo.length > 0) {
          const maxGrado = Math.max(...vistasEnAngulo.map(r => r.grado))
          const rad = (angulo * Math.PI) / 180
          const x = cx + Math.cos(rad) * (maxGrado * PX_POR_GRADO)
          const y = cy + Math.sin(rad) * (maxGrado * PX_POR_GRADO)
          
          if (primero) {
            ctx.moveTo(x, y)
            primero = false
          } else {
            ctx.lineTo(x, y)
          }
        }
      })
      
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([]) // Restaurar línea sólida
    }

  }, [respuestas, width, height])

  return (
    <canvas 
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #ccc', background: 'white' }}
    />
  )
}