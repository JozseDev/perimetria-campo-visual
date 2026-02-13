import { useRef, useEffect, useState } from 'react'
import Islotes from './components/Islotes'
import './App.css'

type IntensidadGoldmann = '0.0' | '0.1' | '0.2' | '0.3' | '0.4' | '0.5' | '0.6' | '0.7' | '0.8' | '0.9' | '1.0'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [estimuloPos, setEstimuloPos] = useState({ x: 0, y: 0 })
  const [respuestas, setRespuestas] = useState<any[]>([])
  const [posicionesExamen, setPosicionesExamen] = useState<any[]>([])
  const [indiceActual, setIndiceActual] = useState(0)
  const [vista, setVista] = useState<'examen' | 'resultados'>('examen')
  const [intensidadActual, setIntensidadActual] = useState<IntensidadGoldmann>('0.0')
  const [ojoActual, setOjoActual] = useState<'OD' | 'OI'>('OD')
  const [feedback, setFeedback] = useState('')

  // Configuración de intensidades estilo Goldmann real
  const intensidadConfig = {
    '0.0': { tamaño: 14, color: '#000000', nombre: '0.0 (máx)' },
    '0.1': { tamaño: 13, color: '#1a1a1a', nombre: '0.1' },
    '0.2': { tamaño: 12, color: '#333333', nombre: '0.2' },
    '0.3': { tamaño: 11, color: '#4d4d4d', nombre: '0.3' },
    '0.4': { tamaño: 10, color: '#666666', nombre: '0.4' },
    '0.5': { tamaño: 9, color: '#808080', nombre: '0.5' },
    '0.6': { tamaño: 8, color: '#999999', nombre: '0.6' },
    '0.7': { tamaño: 7, color: '#b3b3b3', nombre: '0.7' },
    '0.8': { tamaño: 6, color: '#cccccc', nombre: '0.8' },
    '0.9': { tamaño: 5, color: '#e6e6e6', nombre: '0.9' },
    '1.0': { tamaño: 4, color: '#ffffff', border: '1px solid #ccc', nombre: '1.0 (mín)' }
  }

  const isMobile = window.innerWidth < 600

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 600, 600)

    const cx = 300
    const cy = 300
    const PX_POR_GRADO = 3.5
    const gradosMax = 70

    // Generar posiciones en grados reales
    if (posicionesExamen.length === 0) {
      const posiciones = []
      const angulos = [0, 45, 90, 135, 180, 225, 270, 315]
      const grados = [10, 20, 30, 40, 50, 60, 70]
      
      for (let ang of angulos) {
        for (let g of grados) {
          posiciones.push({ 
            angulo: ang, 
            distancia: Math.round(g * PX_POR_GRADO),
            grado: g,
            id: `${ang}-${g}` 
          })
        }
      }
      setPosicionesExamen(posiciones)
    }

    // Dibujar círculos concéntricos con etiquetas
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 0.5
    const gradosRetícula = [10, 20, 30, 40, 50, 60, 70]
    gradosRetícula.forEach(g => {
      const r = g * PX_POR_GRADO
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
      
      ctx.fillStyle = '#999'
      ctx.font = '10px Arial'
      ctx.fillText(`${g}°`, cx + r - 15, cy - 5)
    })

    // Líneas radiales
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 0.5
    for (let ang = 0; ang < 360; ang += 30) {
      const rad = (ang * Math.PI) / 180
      const x = cx + Math.cos(rad) * (gradosMax * PX_POR_GRADO)
      const y = cy + Math.sin(rad) * (gradosMax * PX_POR_GRADO)
      
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.stroke()
      
      ctx.fillStyle = '#999'
      ctx.font = '10px Arial'
      ctx.fillText(`${ang}°`, x + 5, y - 5)
    }

    // Punto de fijación
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
    ctx.fill()

    // Dibujar estímulo actual
    if (posicionesExamen.length > 0 && indiceActual < posicionesExamen.length) {
      const pos = posicionesExamen[indiceActual]
      const rad = (pos.angulo * Math.PI) / 180
      const estX = cx + Math.cos(rad) * pos.distancia
      const estY = cy + Math.sin(rad) * pos.distancia

      setEstimuloPos({ x: estX, y: estY })

      const config = intensidadConfig[intensidadActual]
      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.arc(estX, estY, config.tamaño, 0, 2 * Math.PI)
      ctx.fill()
      
      // Borde para estímulos blancos
      if (intensidadActual === '1.0') {
        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      
      ctx.fillStyle = '#666'
      ctx.font = 'bold 12px Arial'
      ctx.fillText(`${pos.grado}°`, estX + 15, estY - 15)
    }
  }, [indiceActual, posicionesExamen, vista])  // ✅ AGREGAMOS vista

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  const canvasX = (e.clientX - rect.left) * scaleX
  const canvasY = (e.clientY - rect.top) * scaleY

  const dx = canvasX - estimuloPos.x
  const dy = canvasY - estimuloPos.y
  const distancia = Math.sqrt(dx * dx + dy * dy)

  if (posicionesExamen.length > 0 && indiceActual < posicionesExamen.length) {
    const posActual = posicionesExamen[indiceActual]
    
    const nuevaRespuesta = {
      id: crypto.randomUUID(),
      angulo: posActual.angulo,
      distancia: posActual.distancia,
      grado: posActual.grado,
      intensidad: intensidadActual,
      tamaño: intensidadConfig[intensidadActual as IntensidadGoldmann].tamaño,
      ojo: ojoActual,
      visto: distancia < 20,
      timestamp: new Date().toLocaleString()
    }

    setRespuestas([...respuestas, nuevaRespuesta])
    
    // ✅ CONFIRMACIÓN EN CONSOLA
    console.log('📋 Respuesta:', nuevaRespuesta)
    console.log('✅ Respuesta guardada exitosamente')

    // Después de setRespuestas y console.log
setFeedback('✅ Respuesta guardada')

// Limpiar el mensaje después de 1.5 segundos
setTimeout(() => setFeedback(''), 1500)
  }

  if (indiceActual < posicionesExamen.length - 1) {
    setIndiceActual(indiceActual + 1)
  } else {
    alert('🎉 ¡Examen completado!')
    console.log('📊 Total de respuestas:', respuestas.length + 1)
    setIndiceActual(0)
  }
}

  const exportarPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default
      const { default: autoTable } = await import('jspdf-autotable')
      
      const canvasElement = document.querySelector('canvas')
      if (!canvasElement) throw new Error('No se encontró el canvas')
      
      const canvasImg = await html2canvas(canvasElement)
      const imgData = canvasImg.toDataURL('image/png')
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(10, 25, 40)
      doc.text('Perimetría de Campo Visual', 20, 20)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`by JozseDev © ${new Date().getFullYear()}`, 20, 30)
      doc.line(20, 35, 280, 35)
      
      const respuestasOjo = respuestas.filter(r => r.ojo === ojoActual)
      
      doc.setFontSize(11)
      doc.setTextColor(50, 50, 50)
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 45)
      doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 52)
      doc.text(`Ojo evaluado: ${ojoActual === 'OD' ? 'Derecho (OD)' : 'Izquierdo (OI)'}`, 20, 59)
      doc.text(`Total de estímulos: ${respuestasOjo.length}`, 20, 66)
      
      const vistas = respuestasOjo.filter(r => r.visto).length
      const noVistas = respuestasOjo.filter(r => !r.visto).length
      const porcentajeVisto = respuestasOjo.length > 0 ? ((vistas / respuestasOjo.length) * 100).toFixed(1) : '0'
      
      doc.text(`Vistos: ${vistas} (${porcentajeVisto}%)`, 120, 45)
      doc.text(`No vistos: ${noVistas} (${(100 - parseFloat(porcentajeVisto)).toFixed(1)}%)`, 120, 52)
      
      doc.addImage(imgData, 'PNG', 20, 75, 140, 140)
      
      if (respuestasOjo.length > 0) {
        const intensidades = ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0']
        const tablaData = intensidades.map(int => {
          const respuestasInt = respuestasOjo.filter(r => r.intensidad === int)
          const vistasInt = respuestasInt.filter(r => r.visto).length
          const totalInt = respuestasInt.length
          
          return [
            int,
            `${vistasInt}/${totalInt}`,
            `${totalInt > 0 ? ((vistasInt / totalInt) * 100).toFixed(0) : 0}%`
          ]
        })
        
        autoTable(doc, {
          startY: 225,
          head: [['Intensidad', 'Vistos/Total', 'Porcentaje']],
          body: tablaData,
          theme: 'grid',
          headStyles: { fillColor: [10, 25, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
          margin: { left: 20, right: 20 }
        })
      }
      
      const finalY = (doc as any).lastAutoTable?.finalY || 250
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text('Informe generado automáticamente · Perimetría de Campo Visual by JozseDev', 20, finalY + 20)
      
      doc.save(`perimetria-${ojoActual}-${new Date().toISOString().slice(0, 10)}.pdf`)
      alert('✅ PDF generado exitosamente')
      
    } catch (error) {
      console.error('❌ Error:', error)
      alert('Error al generar PDF: ' + error)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      minHeight: '100vh',
      padding: isMobile ? '10px' : '20px',
      boxSizing: 'border-box',
      background: 'linear-gradient(145deg, #9ca6be 0%, #53738d 100%)'
    }}>
      {/* ✅ FEEDBACK VISUAL - PONELO ACÁ, ARRIBA DEL TÍTULO */}
    {feedback && (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#28a745',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease'
      }}>
        {feedback}
      </div>
    )}
      
      <h1 style={{ 
        fontSize: isMobile ? '1.5rem' : '2rem',
        textAlign: 'center',
        margin: isMobile ? '5px 0 10px 0' : '10px 0 20px 0',
        wordBreak: 'break-word',
        color: '#0a1928'
      }}>
        {isMobile ? 'Perimetría · JozseDev' : 'Perimetría de Campo Visual · JozseDev'}
      </h1>
      
      {/* SELECTOR DE INTENSIDAD - GOLDMANN REAL */}
      <div style={{ 
        marginBottom: isMobile ? '10px' : '15px', 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: isMobile ? '5px' : '8px', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%'
      }}>
        <span style={{ fontWeight: 'bold', marginRight: '5px' }}>Intensidad:</span>
        {Object.entries(intensidadConfig).map(([key]) => (
          <button
            key={key}
            onClick={() => setIntensidadActual(key as IntensidadGoldmann)}
            style={{
              padding: isMobile ? '6px 10px' : '4px 8px',
              background: intensidadActual === key ? '#4d8fcc' : '#f0f0f0',
              color: intensidadActual === key ? 'white' : '#333',
              border: intensidadActual === key ? '2px solid #0a1928' : '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: intensidadActual === key ? 'bold' : 'normal',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              boxShadow: intensidadActual === key ? '0 0 5px rgba(77,143,204,0.5)' : 'none'
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* SELECTOR DE OJO */}
      <div style={{ 
        marginBottom: isMobile ? '15px' : '15px', 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: isMobile ? '10px' : '10px', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%'
      }}>
        <span style={{ fontWeight: 'bold' }}>Ojo:</span>
        <button
          onClick={() => setOjoActual('OD')}
          style={{
            padding: isMobile ? '10px 20px' : '6px 12px',
            background: ojoActual === 'OD' ? '#4d8fcc' : '#eee',
            color: ojoActual === 'OD' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: ojoActual === 'OD' ? 'bold' : 'normal',
            flex: isMobile ? '1 0 40%' : 'none'
          }}
        >
          👁️ {isMobile ? 'OD' : 'Derecho (OD)'}
        </button>
        <button
          onClick={() => setOjoActual('OI')}
          style={{
            padding: isMobile ? '10px 20px' : '6px 12px',
            background: ojoActual === 'OI' ? '#4d8fcc' : '#eee',
            color: ojoActual === 'OI' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: ojoActual === 'OI' ? 'bold' : 'normal',
            flex: isMobile ? '1 0 40%' : 'none'
          }}
        >
          👁️ {isMobile ? 'OI' : 'Izquierdo (OI)'}
        </button>
      </div>
      
      {/* BOTONES PRINCIPALES */}
      <div style={{ 
        marginBottom: isMobile ? '20px' : '20px', 
        display: 'flex', 
        gap: isMobile ? '15px' : '10px',
        justifyContent: 'center',
        width: '100%'
      }}>
        <button 
          onClick={() => setVista('examen')}
          style={{ 
            padding: isMobile ? '12px 20px' : '8px 16px', 
            background: vista === 'examen' ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            flex: isMobile ? '1 0 40%' : 'none'
          }}
        >
          Tomar Examen
        </button>
        <button 
          onClick={() => setVista('resultados')}
          style={{ 
            padding: isMobile ? '12px 20px' : '8px 16px', 
            background: vista === 'resultados' ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            flex: isMobile ? '1 0 40%' : 'none'
          }}
        >
          Ver Resultados
        </button>
      </div>

      {vista === 'examen' ? (
        <>
          <div style={{ 
            width: '100%', 
            maxWidth: '600px', 
            aspectRatio: '1/1',
            margin: '0 auto'
          }}>
            <canvas 
              ref={canvasRef}
              width={600}
              height={600}
              onClick={handleCanvasClick}
              style={{ 
                width: '100%',
                height: '100%',
                border: '2px solid black',
                backgroundColor: 'white'
              }}
            />
          </div>
          <p style={{ 
            marginTop: '15px', 
            fontSize: isMobile ? '0.9rem' : '1rem',
            textAlign: 'center'
          }}>
            Posición {indiceActual + 1} de {posicionesExamen.length} · 
            {posicionesExamen[indiceActual]?.grado}° · 
            Ojo: {ojoActual === 'OD' ? 'Derecho' : 'Izquierdo'}
          </p>
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ fontSize: isMobile ? '1.3rem' : '1.5rem' }}>Resultados del Examen</h2>
          
          <div style={{ 
            width: '100%', 
            maxWidth: '600px', 
            aspectRatio: '1/1',
            margin: '0 auto'
          }}>
            <Islotes respuestas={respuestas.filter(r => r.ojo === ojoActual)} />
          </div>
          
          <p style={{ marginTop: '10px', fontSize: isMobile ? '0.8rem' : '1rem' }}>
            🟢 Visto | 🔴 No visto | ⚫ Isóptera
          </p>
          
          <button 
            onClick={exportarPDF}
            style={{
              marginTop: '20px',
              padding: isMobile ? '12px 20px' : '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            📄 Exportar a PDF
          </button>
        </div>
      )}
      
      <footer style={{ 
        marginTop: '30px', 
        color: '#666', 
        fontSize: isMobile ? '11px' : '13px',
        borderTop: '1px solid #eee',
        paddingTop: '20px',
        width: '100%',
        textAlign: 'center'
      }}>
        Perimetría de Campo Visual · by <strong>JozseDev</strong> © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default App