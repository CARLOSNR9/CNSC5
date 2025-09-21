document.addEventListener('DOMContentLoaded', () => {
    // Definición de variables y elementos del DOM
    const iniciarBtn = document.getElementById('iniciar-simulacro-btn');
    const infoSection = document.getElementById('info-section');
    const simulacroContainer = document.getElementById('simulacro-container');
    const preguntaBox = document.getElementById('pregunta-box');
    const retroalimentacionBox = document.getElementById('retroalimentacion-box');
    const siguienteBtn = document.getElementById('siguiente-btn');
    const resultadoFinal = document.getElementById('resultado-final');

    let preguntas = [];
    let preguntasSeleccionadas = [];
    let preguntaActualIndex = 0;
    let respuestasCorrectas = 0;
    let respuestaSeleccionada = null;

    // Constantes para el simulacro
    const NUMERO_PREGUNTAS_SIMULACRO = 20;
    const PUNTAJE_APROBATORIO = 70;
    const PUNTAJE_POR_PREGUNTA = 100 / NUMERO_PREGUNTAS_SIMULACRO;

    // Función para obtener las preguntas del archivo JSON
    async function obtenerPreguntas() {
        try {
            const response = await fetch('../json/gobierno_de_datos.json');
            preguntas = await response.json();
            console.log("Preguntas cargadas:", preguntas);
        } catch (error) {
            console.error('Error al cargar las preguntas:', error);
            preguntaBox.innerHTML = '<p>No se pudieron cargar las preguntas. Por favor, revisa el archivo JSON.</p>';
        }
    }

    // Función para seleccionar 20 preguntas aleatorias
    function seleccionarPreguntasAleatorias() {
        if (preguntas.length > NUMERO_PREGUNTAS_SIMULACRO) {
            const preguntasBarajadas = preguntas.sort(() => 0.5 - Math.random());
            preguntasSeleccionadas = preguntasBarajadas.slice(0, NUMERO_PREGUNTAS_SIMULACRO);
        } else {
            preguntasSeleccionadas = preguntas.sort(() => 0.5 - Math.random());
        }
        console.log("Preguntas seleccionadas para el simulacro:", preguntasSeleccionadas);
    }

    // Función para renderizar la pregunta actual
    function renderizarPregunta() {
        if (preguntaActualIndex >= preguntasSeleccionadas.length) {
            mostrarResultadoFinal();
            return;
        }

        const preguntaData = preguntasSeleccionadas[preguntaActualIndex];
        preguntaBox.innerHTML = `
            <p><strong>Pregunta ${preguntaActualIndex + 1} de ${preguntasSeleccionadas.length}</strong></p>
            <div class="pregunta-caso"><strong>Caso:</strong> ${preguntaData.caso}</div>
            <p class="pregunta-enunciado"><strong>Enunciado:</strong> ${preguntaData.enunciado}</p>
            <ul class="opciones-list">
                ${preguntaData.opciones.map(opcion => `
                    <li>
                        <label>
                            <span class="opcion-texto">${opcion}</span>
                        </label>
                    </li>
                `).join('')}
            </ul>
        `;

        const opcionesList = preguntaBox.querySelector('.opciones-list');
        opcionesList.addEventListener('click', manejarRespuesta);

        retroalimentacionBox.style.display = 'none';
        siguienteBtn.style.display = 'none';
        respuestaSeleccionada = null;
    }

    // Función para manejar la selección de respuesta
    function manejarRespuesta(e) {
        if (respuestaSeleccionada) return;

        const clickedItem = e.target.closest('li');
        if (!clickedItem) return;

        respuestaSeleccionada = clickedItem.querySelector('.opcion-texto').textContent;
        const preguntaData = preguntasSeleccionadas[preguntaActualIndex];
        const esCorrecta = respuestaSeleccionada.startsWith(preguntaData.respuesta_correcta);

        clickedItem.classList.add('selected');

        retroalimentacionBox.style.display = 'block';
        retroalimentacionBox.textContent = preguntaData.explicacion;
        retroalimentacionBox.classList.remove('retroalimentacion-correcta', 'retroalimentacion-incorrecta');

        if (esCorrecta) {
            respuestasCorrectas++;
            clickedItem.classList.add('correcta');
            retroalimentacionBox.classList.add('retroalimentacion-correcta');
        } else {
            clickedItem.classList.add('incorrecta');
            retroalimentacionBox.classList.add('retroalimentacion-incorrecta');
            const respuestaCorrectaTexto = preguntaData.opciones.find(opcion => opcion.startsWith(preguntaData.respuesta_correcta));
            const correctaLi = Array.from(e.currentTarget.querySelectorAll('li')).find(li => li.querySelector('.opcion-texto').textContent === respuestaCorrectaTexto);
            if (correctaLi) {
                correctaLi.classList.add('correcta');
            }
        }

        siguienteBtn.style.display = 'block';
    }

    // Función para mostrar los resultados finales
    function mostrarResultadoFinal() {
        infoSection.style.display = 'none';
        simulacroContainer.style.display = 'block';
        preguntaBox.style.display = 'none';
        siguienteBtn.style.display = 'none';
        retroalimentacionBox.style.display = 'none';
        
        const puntaje = respuestasCorrectas * PUNTAJE_POR_PREGUNTA;

        // Si el puntaje es 100, activa la animación de confeti
        if (puntaje === 100) {
            confetti({
                particleCount: 150,
                spread: 120,
                origin: { y: 0.6 }
            });
        }
        
        const estado = puntaje >= PUNTAJE_APROBATORIO ? '¡APROBADO!' : 'NO APROBADO';
        const recomendacion = puntaje >= PUNTAJE_APROBATORIO ? '¡Felicitaciones! Has superado el puntaje mínimo de 70.00. Sigue practicando.' : 'Necesitas un puntaje mínimo de 70.00 para pasar. Sigue estudiando los conceptos clave.';

        // Guardar el resultado en localStorage
        let resultadosAnteriores = JSON.parse(localStorage.getItem('gobierno_de_datos_resultados')) || [];
        resultadosAnteriores.push({
            puntaje: puntaje.toFixed(2),
            fecha: new Date().toLocaleString()
        });
        localStorage.setItem('gobierno_de_datos_resultados', JSON.stringify(resultadosAnteriores));

        resultadoFinal.style.display = 'block';
        resultadoFinal.innerHTML = `
            <h2>Resultados del Simulacro</h2>
            <p>Respuestas correctas: ${respuestasCorrectas} de ${preguntasSeleccionadas.length}</p>
            <p>Tu puntaje: ${puntaje.toFixed(2)} / 100</p>
            <p><strong>Estado: ${estado}</strong></p>
            <p>${recomendacion}</p>
            <p><a href="../index.html" class="btn">Volver al Inicio</a></p>
        `;
    }

    // Evento al hacer clic en el botón de "Iniciar Simulacro"
    iniciarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        infoSection.style.display = 'none';
        simulacroContainer.style.display = 'block';
        seleccionarPreguntasAleatorias();
        preguntaActualIndex = 0;
        respuestasCorrectas = 0;
        renderizarPregunta();
    });

    // Evento al hacer clic en el botón de "Siguiente"
    siguienteBtn.addEventListener('click', () => {
        preguntaActualIndex++;
        renderizarPregunta();
    });

    // Cargar las preguntas al iniciar la página
    obtenerPreguntas();
});