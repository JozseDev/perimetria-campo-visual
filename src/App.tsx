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
  const [mostrarIntro, setMostrarIntro] = useState(true)
  const [mostrarDatosPaciente, setMostrarDatosPaciente] = useState(false)
  const [fechaExamen, setFechaExamen] = useState<Date>(new Date())
  const [horaExamen, setHoraExamen] = useState('10:00')
  const [nombrePaciente, setNombrePaciente] = useState('')
  const [nombreExaminador, setNombreExaminador] = useState('')

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
  }, [indiceActual, posicionesExamen, vista, mostrarIntro]) // 👈 AGREGAMOS mostrarIntro

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

    const canvasImg = await html2canvas(canvasElement, {
      scale: 2,
      backgroundColor: '#ffffff'
    })
    const imgData = canvasImg.toDataURL('image/png')

    // ============================================
    // CONFIGURACIÓN INICIAL
    // ============================================
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // ✅ FORZAR FUENTE ESTÁNDAR (Times Roman es más compatible)
    doc.setFont('times', 'normal')

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let currentPage = 1

    // ============================================
    // FUNCIÓN PARA AGREGAR ENCABEZADO (LOGO)
    // ============================================
    const addHeader = async () => {
      try {
        const imgPath = window.location.origin + '/Ojo_fondo.png'
        const img = new Image()
        img.src = imgPath
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
        
        if (img.complete && img.naturalHeight !== 0) {
          doc.addImage(img, 'PNG', 10, 8, 20, 20)
        } else {
          doc.setFont('times', 'normal')
          doc.setFontSize(16)
          doc.setTextColor(10, 25, 40)
          doc.text('👁️', 15, 20)
        }
      } catch {
        doc.setFont('times', 'normal')
        doc.setFontSize(16)
        doc.setTextColor(10, 25, 40)
        doc.text('👁️', 15, 20)
      }

      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(`Página ${currentPage}`, pageWidth - 20, 20, { align: 'right' })
    }

    // ============================================
    // FUNCIÓN PARA AGREGAR PIE DE PÁGINA
    // ============================================
    const addFooter = () => {
      doc.setFont('times', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        'Informe generado automáticamente · Campimetría cinética by JozseDev',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // ============================================
    // AGREGAR ENCABEZADO A LA PRIMERA PÁGINA
    // ============================================
    await addHeader()

    // ============================================
    // TÍTULO PRINCIPAL
    // ============================================
    doc.setFont('times', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(10, 25, 40)
    doc.text('Campimetría cinética', pageWidth / 2, 35, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`by JozseDev © ${new Date().getFullYear()}`, pageWidth / 2, 42, { align: 'center' })

    // ============================================
    // DATOS DEL PACIENTE
    // ============================================
    let yPos = 55

    doc.setFillColor(245, 245, 250)
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 35, 3, 3, 'F')

    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 25, 40)

    // ✅ TEXTO SIN CARACTERES EXTRAÑOS
    const pacienteText = nombrePaciente ? `Paciente: ${nombrePaciente}` : 'Paciente: No especificado'
    const examinadorText = nombreExaminador ? `Examinador: ${nombreExaminador}` : 'Examinador: No especificado'
    const fechaText = `Fecha: ${fechaExamen.toLocaleDateString()} - ${horaExamen}`

    doc.text(pacienteText, 20, yPos)
    yPos += 7
    doc.text(examinadorText, 20, yPos)
    yPos += 7
    doc.setFont('times', 'normal')
    doc.text(fechaText, 20, yPos)
    yPos += 15

    // ============================================
    // DATOS DEL EXAMEN
    // ============================================
    const respuestasOjo = respuestas.filter(r => r.ojo === ojoActual)

    doc.setFillColor(250, 250, 255)
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 20, 3, 3, 'F')

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.text(`Ojo evaluado: ${ojoActual === 'OD' ? 'Derecho (OD)' : 'Izquierdo (OI)'}`, 20, yPos)
    yPos += 6
    doc.text(`Total de estímulos: ${respuestasOjo.length}`, 20, yPos)
    yPos += 15

    // ============================================
    // ESTADÍSTICAS
    // ============================================
    const vistas = respuestasOjo.filter(r => r.visto).length
    const noVistas = respuestasOjo.filter(r => !r.visto).length
    const porcentajeVisto = respuestasOjo.length > 0 ? ((vistas / respuestasOjo.length) * 100).toFixed(1) : '0'
    const porcentajeNoVisto = (100 - parseFloat(porcentajeVisto)).toFixed(1)

    doc.setFillColor(240, 248, 255)
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 20, 3, 3, 'F')

    // ✅ TEXTO CON FORMATO CORRECTO
    doc.setFont('times', 'normal')
    doc.setTextColor(40, 167, 69)
    doc.text(`Vistos: ${vistas} (${porcentajeVisto}%)`, 20, yPos)
    doc.setTextColor(220, 53, 69)
    doc.text(`No vistos: ${noVistas} (${porcentajeNoVisto}%)`, pageWidth / 2 + 10, yPos)
    yPos += 15

    // ============================================
    // GRÁFICO
    // ============================================
    const imgWidth = 140
    const imgX = (pageWidth - imgWidth) / 2
    doc.addImage(imgData, 'PNG', imgX, yPos, imgWidth, 140)
    yPos += 150

    // Verificar si necesitamos nueva página para la tabla
    if (yPos > pageHeight - 60) {
      doc.addPage()
      currentPage++
      await addHeader()
      yPos = 40
    }

    // ============================================
    // TABLA DE RESULTADOS
    // ============================================
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
        startY: yPos,
        head: [['Intensidad', 'Vistos/Total', 'Porcentaje']],
        body: tablaData,
        theme: 'grid',
        headStyles: {
          fillColor: [10, 25, 40],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: (pageWidth - 120) / 2 },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center',
          font: 'times' // ✅ FORZAR FUENTE EN TABLA
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        }
      })
    }

    // ============================================
    // AGREGAR PIE DE PÁGINA
    // ============================================
    addFooter()

    // ============================================
    // GUARDAR PDF
    // ============================================
    doc.save(`campimetria-${ojoActual}-${new Date().toISOString().slice(0, 10)}.pdf`)
    alert('✅ PDF generado exitosamente')

  } catch (error) {
    console.error('❌ Error:', error)
    alert('Error al generar PDF: ' + error)
  }
}

return (
    <>
      {/* ============================================ */}
      {/* PANTALLA 1: INTRO */}
      {/* ============================================ */}
      {mostrarIntro && !mostrarDatosPaciente && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          minHeight: '100vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #0a4b6e 0%, #0a1928 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '20px',
          boxSizing: 'border-box',
          zIndex: 10000
        }}>
          <div style={{ marginBottom: '20px' }}>
            <img 
              src="/Ojo_fondo.png" 
              alt="JozseDev Medical"
              style={{
                width: isMobile ? '150px' : '300px',
                height: 'auto',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}
            />
          </div>
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : '4rem',
            fontFamily: "'Fenix', serif", 
            margin: '0 0 20px 0', 
            fontWeight: '700',
            color: 'white'
          }}>
            Campimetría cinética
          </h1>
          <p style={{ 
            fontSize: isMobile ? '1.1rem' : '1.5rem', 
            marginBottom: '40px', 
            opacity: 0.9, 
            maxWidth: '600px' 
          }}>
            Tecnología médica para diagnóstico visual
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* ✅ BOTÓN CORREGIDO: Activa la pantalla de datos */}
            <button
              onClick={() => setMostrarDatosPaciente(true)}
              style={{
                padding: isMobile ? '16px 32px' : '14px 28px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: isMobile ? '1.1rem' : '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'
              }}
            >
              Ingresar
            </button>
            <button
              onClick={() => alert('Campimetría cinética · Versión 1.0\nDesarrollado por JozseDev © 2026\nTecnología médica para diagnóstico visual')}
              style={{
                padding: isMobile ? '16px 32px' : '14px 28px',
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50px',
                fontSize: isMobile ? '1.1rem' : '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Información
            </button>
          </div>
          <footer style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '0.9rem',
            opacity: 0.7,
            color: 'white'
          }}>
            by <strong>JozseDev</strong> © {new Date().getFullYear()}
          </footer>
        </div>
      )}

      {/* ============================================ */}
      {/* PANTALLA 2: DATOS DEL PACIENTE */}
      {/* ============================================ */}
      {mostrarDatosPaciente && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: 'linear-gradient(145deg, #0a4b6e 0%, #0a1928 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '20px',
          boxSizing: 'border-box',
          zIndex: 10000,
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              textAlign: 'center',
              marginBottom: '30px',
              color: 'white'
            }}>
              Datos del examen
            </h2>

            {/* FECHA */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                📅 Fecha
              </label>
              <input
                type="date"
                value={fechaExamen.toISOString().split('T')[0]}
                onChange={(e) => setFechaExamen(new Date(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
            </div>

            {/* HORA */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                ⏰ Hora
              </label>
              <input
                type="time"
                value={horaExamen}
                onChange={(e) => setHoraExamen(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
            </div>

            {/* NOMBRE DEL PACIENTE */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                👤 Nombre del paciente
              </label>
              <input
                type="text"
                value={nombrePaciente}
                onChange={(e) => setNombrePaciente(e.target.value)}
                placeholder="Ej: Juan Pérez"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
            </div>

            {/* NOMBRE DEL EXAMINADOR */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                🩺 Examinador
              </label>
              <input
                type="text"
                value={nombreExaminador}
                onChange={(e) => setNombreExaminador(e.target.value)}
                placeholder="Ej: Dr. González"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
            </div>

            {/* BOTONES */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setMostrarDatosPaciente(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Volver
              </button>
              <button
                onClick={() => {
                  setMostrarDatosPaciente(false)
                  setMostrarIntro(false)
                  setIndiceActual(0)
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Comenzar Examen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PANTALLA 3: EXAMEN */}
      {/* ============================================ */}
      {!mostrarIntro && !mostrarDatosPaciente && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          minHeight: '100vh',
          padding: isMobile ? '10px' : '20px',
          boxSizing: 'border-box',
          background: 'linear-gradient(145deg, #0a4b6e 0%, #0a1928 100%)'
        }}>
          {/* FEEDBACK VISUAL */}
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
            color: '#ffffff'
          }}>
            Campimetría cinética
          </h1>
          
          {/* SELECTOR DE INTENSIDAD */}
          <div style={{ 
            marginBottom: isMobile ? '10px' : '15px', 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: isMobile ? '5px' : '8px', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%'
          }}>
            <span style={{ fontWeight: 'bold', marginRight: '5px', color: '#ffffff' }}>Intensidad:</span>
            {Object.entries(intensidadConfig).map(([key]) => (
              <button
                key={key}
                onClick={() => setIntensidadActual(key as IntensidadGoldmann)}
                style={{
                  padding: isMobile ? '6px 10px' : '4px 8px',
                  background: intensidadActual === key ? '#4d8fcc' : '#f0f0f0',
                  color: intensidadActual === key ? 'white' : '#333',
                  border: intensidadActual === key ? '2px solid #ffffff' : '1px solid #000000',
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
            <span style={{ fontWeight: 'bold', color: '#ffffff' }}>Ojo:</span>
            <button
              onClick={() => setOjoActual('OD')}
              style={{
                padding: isMobile ? '10px 20px' : '6px 12px',
                background: ojoActual === 'OD' ? '#4d8fcc' : '#eee',
                color: ojoActual === 'OD' ? 'white' : '#333',
                border: ojoActual === 'OD' ? '2px solid #ffffff' : '1px solid #000000',
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
                border: ojoActual === 'OI' ? '2px solid #ffffff' : '1px solid #000000',
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
              onClick={() => {
                setVista('examen')
                setIndiceActual(0)
              }}
              style={{ 
                padding: isMobile ? '12px 20px' : '8px 16px', 
                background: vista === 'examen' ? '#28a745' : '#ccc',
                color: 'white',
                border: vista === 'examen' ? '2px solid #ffffff' : '1px solid #000000',
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
                border: vista === 'resultados' ? '2px solid #ffffff' : '1px solid #000000',
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
                textAlign: 'center',
                color: '#ffffff'
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
              <h2 style={{ 
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                color: '#ffffff'
              }}>
                Resultados del Examen
              </h2>

              {/* DATOS DEL PACIENTE EN RESULTADOS */}
              {(nombrePaciente || nombreExaminador) && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'left',
                  color: 'white'
                }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>📅 Fecha:</strong> {fechaExamen.toLocaleDateString()} - {horaExamen}
                  </p>
                  {nombrePaciente && (
                    <p style={{ margin: '5px 0' }}>
                      <strong>👤 Paciente:</strong> {nombrePaciente}
                    </p>
                  )}
                  {nombreExaminador && (
                    <p style={{ margin: '5px 0' }}>
                      <strong>🩺 Examinador:</strong> {nombreExaminador}
                    </p>
                  )}
                </div>
              )}
              
              <div style={{ 
                width: '100%', 
                maxWidth: '600px', 
                aspectRatio: '1/1',
                margin: '0 auto'
              }}>
                <Islotes respuestas={respuestas.filter(r => r.ojo === ojoActual)} />
              </div>
              
              <p style={{ marginTop: '10px', fontSize: isMobile ? '0.8rem' : '1rem', color: '#ffffff' }}>
                🟢 Visto | 🔴 No visto | ⚫ Isóptera
              </p>
              
              <button 
                onClick={exportarPDF}
                style={{
                  marginTop: '20px',
                  padding: isMobile ? '12px 20px' : '8px 16px',
                  background: '#dc3545',
                  color: 'white',
                  border: '2px solid #b02a37',
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
            color: '#b8b8b8', 
            fontSize: isMobile ? '11px' : '13px',
            borderTop: '1px solid #b8b8b8',
            paddingTop: '20px',
            width: '100%',
            textAlign: 'center'
          }}>
            Campimetría cinética · by <strong>JozseDev</strong> © {new Date().getFullYear()}
          </footer>
        </div>
      )}
    </>
  )
}  // ← Cierre de la función App

export default App