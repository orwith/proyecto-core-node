const inquirer = require('inquirer');
const { exec } = require('child_process');
const db_ciudades = require('./db/data.json');
const { obtener_zona_horaria, obtener_hora_actual } = require('./models/busquedas');
require("colors");

async function mostrar_menu() {

  console.log('\n***** Reloj Digital *****\n'.green);
  
  try {
    const respuestas = await inquirer.prompt([
      {
        type: 'list',
        name: 'opcion',
        message: 'Selecciona una opción:',
        choices: ['Mostrar Hora Actual', 'Mostrar Hora Mundial', 'Alarma', 'Cronómetro', 'Temporizador', 'Salir'],
      },
    ]);

    switch (respuestas.opcion) {
      case 'Mostrar Hora Actual':
        await mostrar_hora_actual();
        break;
      case 'Mostrar Hora Mundial':
        await mostrar_hora_mundial();
        break;
      case 'Alarma':
        await configurar_alarma();
        break;
      case 'Cronómetro':
        await configurar_cronometro();
        break;
      case 'Temporizador':
        await configurar_temporizador();
        break;
      case 'Salir':
        console.log('Saliendo del Reloj Digital. ¡Hasta luego!');
        break;
      default:
        console.log('Opción no válida');
        break;
    }
  } catch (error) {
    console.error('Error al mostrar el menú:', error);
  }
}

async function mostrar_hora_actual() {
  const hora_actual = new Date().toLocaleTimeString();
  console.log(`La hora actual es: ${hora_actual}`);
  await mostrar_menu();
}

async function mostrar_hora_mundial() {

  const respuesta_continente = await inquirer.prompt([
    {
      type: 'list',
      name: 'continente',
      message: 'Selecciona una opción:',
      choices: ['Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Australia', 'Europe', 'Pacific'],
      loop: false,
    },
  ]);

  const continente = respuesta_continente.continente;

  const ciudades = db_ciudades[continente];

  if (!ciudades || ciudades.length === 0) {
    console.log(`No hay ciudades definidas para el continente ${continente}`);
    mostrar_menu();
    return;
  }

  const respuesta_ciudad = await inquirer.prompt([
    {
      type: 'list',
      name: 'ciudad',
      message: 'Seleccione una ciudad:',
      choices: ciudades,
      loop: false,
    },
  ]);

  const ciudad = respuesta_ciudad.ciudad;

  const hora = await obtener_hora_actual(`${continente}/${ciudad}`);

  if (hora) {
    console.log(`La fecha y hora en ${ciudad}, ${continente} es: ${hora}`);
  } else {
    console.log(`No se pudo obtener la hora para ${ciudad}, ${continente}`);
  }

  mostrar_menu();
}

async function configurar_alarma() {

  const hora_formato_valido = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

  try {
    const respuestas = await inquirer.prompt([
      {
        type: 'input',
        name: 'hora',
        message: 'Ingrese la hora de la alarma en formato HH:mm:ss:',
      },
    ]);

    const hora_ingresada = respuestas.hora;

    if (!hora_formato_valido.test(hora_ingresada)) {
      console.log('La hora ingresada no es válida. Por favor, ingrese una hora válida.');
      mostrar_menu();
      return;
    }

    const ahora = new Date();
    const hora_alarma = new Date(`${ahora.toDateString()} ${hora_ingresada}`);

    if (hora_alarma > ahora) {
      const tiempo_hasta_alarma = hora_alarma.getTime() - ahora.getTime();

      console.log(`Alarma configurada para sonar a las ${respuestas.hora}`);

      await new Promise((resolve) => {
        setTimeout(() => {
          const ruta_audio_alarma = './src/reloj-app/public/audio/alarma.wav';
          const reproducir_audio_alarma = `aplay -f cd -c 2 -r 44100 ${ruta_audio_alarma}`;

          exec(reproducir_audio_alarma, (error) => {
            if (error) {
              console.error(`Error al reproducir el archivo: ${error.message}`);
            }
            resolve();
            mostrar_menu();
          });
        }, tiempo_hasta_alarma);
      });
    } else {
      console.log('La hora ingresada no es válida. Por favor, ingrese una hora válida en el futuro.');
      mostrar_menu();
    }
  } catch (error) {
    console.error('Error al configurar la alarma:', error);
  }
}

async function configurar_cronometro() {

  let tiempo_transcurrido = 0;
  let cronometro;
  
  function mostrar_tiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundos_restantes = segundos % 60;

    console.log(
    `\r${horas < 10 ? '0' : ''}${horas}:${minutos < 10 ? '0' : ''}${minutos}:${segundos_restantes < 10 ? '0' : ''}${segundos_restantes}`
    );
  }

  cronometro = setInterval(function () {
    tiempo_transcurrido++;
    mostrar_tiempo(tiempo_transcurrido);
  }, 1000);

  const respuestas = await inquirer.prompt([
    {
      type: 'input',
      name: 'detener',
      message: 'Presiona "Enter" para detener el cronómetro...\n'
    }
  ]);
  
  async function detener_cronometro() {
    clearInterval(cronometro);
    console.log('Cronómetro detenido.');
  
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    mostrar_menu();
  }
  
  detener_cronometro();
}

async function configurar_temporizador() {
  try {
    const respuestas = await inquirer.prompt([
      {
        type: 'input',
        name: 'duracion_segundos',
        message: 'Ingrese la duración del temporizador en segundos:',
      },
    ]);

    const duracion_segundos = parseInt(respuestas.duracion_segundos, 10);

    if (!/^\d+$/.test(respuestas.duracion_segundos) || isNaN(duracion_segundos) || duracion_segundos <= 0) {
      console.log('Por favor, ingrese un número válido.');
      mostrar_menu();
      return;
    }

    const intervalo_segundos = 1;

    let tiempo_transcurrido = duracion_segundos;

    console.log(`Temporizador configurado para sonar en ${duracion_segundos} segundos.`);

    const intervalo = setInterval(() => {
      console.log(`Tiempo restante: ${tiempo_transcurrido} segundos`);
      tiempo_transcurrido -= intervalo_segundos;

      if (tiempo_transcurrido < 0) {
        clearInterval(intervalo);

        const ruta_audio_temporizador = './src/reloj-app/public/audio/temporizador.wav';
        const reproducir_audio_temporizador = `aplay -f cd -c 2 -r 44100 ${ruta_audio_temporizador}`;

        exec(reproducir_audio_temporizador, (error) => {
          if (error) {
            console.error(`Error al reproducir el archivo: ${error.message}`);
            return;
          }
        });

        mostrar_menu();
      }
    }, intervalo_segundos * 1000);
  
  } catch (error) {
    console.error('Ha ocurrido un error:', error.message);
    mostrar_menu();
  }
}

async function iniciar_programa() {
  try {
    await mostrar_menu();
  } catch (error) {
    console.error('Error al iniciar el programa:', error);
  }
}

iniciar_programa();
