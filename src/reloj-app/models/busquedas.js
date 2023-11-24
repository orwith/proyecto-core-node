const { default: axios } = require("axios");

async function obtener_zona_horaria(ciudad) {
  try {
    const respuesta = await axios.get(`http://worldtimeapi.org/api/timezone/${ciudad}`);
    return respuesta.data.timezone;
  } catch (error) {
    console.error('Error al obtener la zona horaria:', error.message);
    return null;
  }
}

async function obtener_hora_actual(ciudad) {
  const zona_horaria = await obtener_zona_horaria(ciudad);

  if (zona_horaria) {
    try {
      const respuesta = await axios.get(`http://worldtimeapi.org/api/timezone/${zona_horaria}`);
      return respuesta.data.datetime;
    } catch (error) {
      console.error('Error al obtener la hora actual:', error.message);
      return null;
    }
  } else {
    return null;
  }
}

module.exports = {
  obtener_zona_horaria,
  obtener_hora_actual,
};
