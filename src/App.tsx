import { useRef, useEffect, useState } from 'react'
import Islotes from './components/Islotes'
import './App.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [estimuloPos, setEstimuloPos] = useState({ x: 0, y: 0 })
  const [respuestas, setRespuestas] = useState<any[]>([])
  const [posicionesExamen, setPosicionesExamen] = useState<any[]>([])
  const [indiceActual, setIndiceActual] = useState(0)
  const [vista, setVista] = useState<'examen' | 'resultados'>('examen')
  const [intensidadActual, setIntensidadActual] = useState<'1e' | '2e' | '4e'>('4e')
  
  // Configuración de intensidades
  const intensidadConfig = {
    '1e': { tamaño: 4, color: '#ff9999', nombre: '1e (bajo)' },
    '2e': { tamaño: 8, color: '#ff6666', nombre: '2e (medio)' },
    '4e': { tamaño: 12, color: '#ff0000', nombre: '4e (alto)' }
  }
  
  const [ojoActual, setOjoActual] = useState<'OD' | 'OI'>('OD')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 600, 600)

    const cx = 300
    const cy = 300
    const radioMax = 250

    // Generar posiciones si no existen
    if (posicionesExamen.length === 0) {
      const posiciones = []
      const angulos = [0, 45, 90, 135, 180, 225, 270, 315]
      const distancias = [60, 120, 180, 240]
      for (let ang of angulos) {
        for (let dist of distancias) {
          posiciones.push({ angulo: ang, distancia: dist, id: `${ang}-${dist}` })
        }
      }
      setPosicionesExamen(posiciones)
    }

    // Dibujar retícula
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 0.5
    for (let r = 50; r <= radioMax; r += 50) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
    }

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

    // Dibujar estímulo actual
    if (posicionesExamen.length > 0 && indiceActual < posicionesExamen.length) {
      const pos = posicionesExamen[indiceActual]
      const rad = (pos.angulo * Math.PI) / 180
      const estX = cx + Math.cos(rad) * pos.distancia
      const estY = cy + Math.sin(rad) * pos.distancia

      setEstimuloPos({ x: estX, y: estY })

      const config = intensidadConfig[intensidadActual as keyof typeof intensidadConfig]
      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.arc(estX, estY, config.tamaño, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [indiceActual, posicionesExamen])

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
      const config = intensidadConfig[intensidadActual as keyof typeof intensidadConfig]
      
      const nuevaRespuesta = {
        id: crypto.randomUUID(),
        angulo: posActual.angulo,
        distancia: posActual.distancia,
        intensidad: intensidadActual,
        tamaño: config.tamaño,
        ojo: ojoActual,
        visto: distancia < 20,
        timestamp: new Date().toLocaleString()
      }

      setRespuestas([...respuestas, nuevaRespuesta])
      console.log('📋 Respuesta:', nuevaRespuesta)

      fetch('http://localhost:3001/api/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaRespuesta)
      })
        .then(res => res.json())
        .then(data => console.log('💾 DB:', data))
        .catch(err => console.error('❌ Error DB:', err))
    }

    if (indiceActual < posicionesExamen.length - 1) {
      setIndiceActual(indiceActual + 1)
    } else {
      alert('🎉 ¡Examen completado!')
      console.log('📊 Total de respuestas:', respuestas)
      setIndiceActual(0)
    }
  }

  // 📄 Exportar resultados a PDF profesional - VERSIÓN CORREGIDA Y COMPLETA
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
      
      // Título y marca
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(10, 25, 40)
      doc.text('Perimetría de Campo Visual', 20, 20)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`by JozseDev © ${new Date().getFullYear()}`, 20, 30)
      doc.line(20, 35, 280, 35)
      
      // Información del examen
      doc.setFontSize(11)
      doc.setTextColor(50, 50, 50)
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 45)
      doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 52)
      doc.text(`Ojo evaluado: ${ojoActual === 'OD' ? 'Derecho (OD)' : 'Izquierdo (OI)'}`, 20, 59)
      doc.text(`Total de estímulos: ${respuestas.filter(r => r.ojo === ojoActual).length}`, 20, 66)
      
      // Estadísticas filtradas por ojo actual
      const respuestasOjo = respuestas.filter(r => r.ojo === ojoActual)
      const vistas = respuestasOjo.filter(r => r.visto).length
      const noVistas = respuestasOjo.filter(r => !r.visto).length
      const porcentajeVisto = respuestasOjo.length > 0 ? ((vistas / respuestasOjo.length) * 100).toFixed(1) : '0'
      const porcentajeNoVisto = respuestasOjo.length > 0 ? (100 - parseFloat(porcentajeVisto)).toFixed(1) : '0'
      
      doc.text(`Vistos: ${vistas} (${porcentajeVisto}%)`, 120, 45)
      doc.text(`No vistos: ${noVistas} (${porcentajeNoVisto}%)`, 120, 52)
      
      // Gráfico
      doc.addImage(imgData, 'PNG', 20, 75, 140, 140)
      
      // Tabla de resultados por intensidad (FILTRADA POR OJO)
      if (respuestasOjo.length > 0) {
        const intensidades = ['1e', '2e', '4e']
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
          headStyles: { 
            fillColor: [10, 25, 40],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 }
          },
          margin: { left: 20, right: 20 }
        })
      }
      
      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || 250
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(
        'Informe generado automáticamente · Perimetría de Campo Visual by JozseDev',
        20,
        finalY + 20
      )
      
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
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      
      <h1>Perimetría de Campo Visual · JozseDev</h1>
      
      {/* SELECTOR DE INTENSIDAD */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>Intensidad:</span>
        {Object.entries(intensidadConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setIntensidadActual(key as '1e' | '2e' | '4e')}
            style={{
              padding: '6px 12px',
              background: intensidadActual === key ? config.color : '#eee',
              color: intensidadActual === key ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: intensidadActual === key ? 'bold' : 'normal'
            }}
          >
            {config.nombre}
          </button>
        ))}
      </div>

      {/* SELECTOR DE OJO */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>Ojo:</span>
        <button
          onClick={() => setOjoActual('OD')}
          style={{
            padding: '6px 12px',
            background: ojoActual === 'OD' ? '#4d8fcc' : '#eee',
            color: ojoActual === 'OD' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: ojoActual === 'OD' ? 'bold' : 'normal'
          }}
        >
          👁️ Derecho (OD)
        </button>
        <button
          onClick={() => setOjoActual('OI')}
          style={{
            padding: '6px 12px',
            background: ojoActual === 'OI' ? '#4d8fcc' : '#eee',
            color: ojoActual === 'OI' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: ojoActual === 'OI' ? 'bold' : 'normal'
          }}
        >
          👁️ Izquierdo (OI)
        </button>
      </div>
      
      {/* BOTONES DE VISTA */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setVista('examen')}
          style={{ 
            padding: '8px 16px', 
            background: vista === 'examen' ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tomar Examen
        </button>
        <button 
          onClick={() => setVista('resultados')}
          style={{ 
            padding: '8px 16px', 
            background: vista === 'resultados' ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Ver Resultados
        </button>
      </div>

      {vista === 'examen' ? (
        <>
          <canvas 
            ref={canvasRef}
            width={600}
            height={600}
            onClick={handleCanvasClick}
            style={{ 
              border: '2px solid black',
              backgroundColor: 'white'
            }}
          />
          <p>Posición {indiceActual + 1} de {posicionesExamen.length} · Ojo: {ojoActual === 'OD' ? 'Derecho' : 'Izquierdo'}</p>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>Resultados del Examen</h2>
          <Islotes respuestas={respuestas.filter(r => r.ojo === ojoActual)} />
          <p style={{ marginTop: '10px' }}>
            🟢 Visto | 🔴 No visto | 🟦 Islote de visión
          </p>
          
          {/* BOTONES DE ACCIÓN */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('http://localhost:3001/api/respuestas')
                  const data = await res.json()
                  setRespuestas(data)
                  alert('✅ Respuestas cargadas desde la base de datos')
                } catch (error) {
                  alert('❌ Error al cargar: ' + error)
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📥 Cargar desde DB
            </button>
            
            <button 
              onClick={exportarPDF}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📄 Exportar a PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App