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

    // Limpiar
    ctx.clearRect(0, 0, width, height)

    // Dibujar retícula de fondo (misma que el examen)
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 0.5
    const cx = 300
    const cy = 300
    const radioMax = 250

    // Círculos concéntricos
    for (let r = 50; r <= radioMax; r += 50) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Líneas radiales
    for (let ang = 0; ang < 360; ang += 30) {
      const rad = (ang * Math.PI) / 180
      const x = cx + Math.cos(rad) * radioMax
      const y = cy + Math.sin(rad) * radioMax
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // Punto de fijación
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
    ctx.fill()

    // SI HAY RESPUESTAS, DIBUJAR ISLOTES
    if (respuestas.length > 0) {
      // Agrupar respuestas por ángulo y distancia
      const puntosVistos = respuestas.filter(r => r.visto === true)
      const puntosNoVistos = respuestas.filter(r => r.visto === false)

      // Dibujar puntos VISTOS (verdes)
      puntosVistos.forEach(r => {
        const rad = (r.angulo * Math.PI) / 180
        const x = cx + Math.cos(rad) * r.distancia
        const y = cy + Math.sin(rad) * r.distancia
        
        ctx.fillStyle = '#00ff00'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = 'black'
        ctx.font = '10px Arial'
        ctx.fillText('✓', x - 3, y - 8)
      })

      // Dibujar puntos NO VISTOS (rojos)
      puntosNoVistos.forEach(r => {
        const rad = (r.angulo * Math.PI) / 180
        const x = cx + Math.cos(rad) * r.distancia
        const y = cy + Math.sin(rad) * r.distancia
        
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = 'black'
        ctx.font = '10px Arial'
        ctx.fillText('✗', x - 3, y - 8)
      })

      // DIBUJAR ISLOTE (contorno suave)
      // Esto crea una línea que envuelve los puntos vistos
      ctx.strokeStyle = '#0066cc'
      ctx.lineWidth = 2
      
      // Para simplificar, dibujamos una curva que conecta los puntos más externos
      const angulosUnicos = [...new Set(respuestas.map(r => r.angulo))].sort((a,b) => a - b)
      
      ctx.beginPath()
      let primero = true
      
      angulosUnicos.forEach(angulo => {
        // Encontrar la distancia MÁXIMA vista para este ángulo
        const vistasEnAngulo = respuestas
          .filter(r => r.angulo === angulo && r.visto === true)
        
        if (vistasEnAngulo.length > 0) {
          const maxDist = Math.max(...vistasEnAngulo.map(r => r.distancia))
          const rad = (angulo * Math.PI) / 180
          const x = cx + Math.cos(rad) * maxDist
          const y = cy + Math.sin(rad) * maxDist
          
          if (primero) {
            ctx.moveTo(x, y)
            primero = false
          } else {
            ctx.lineTo(x, y)
          }
        }
      })
      
      ctx.closePath()
      ctx.strokeStyle = '#0066cc'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = 'rgba(0,102,204,0.1)'
      ctx.fill()
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