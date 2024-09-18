const filterBtn = document.querySelector('#filter');
const startDateInput = document.querySelector('#start-date');
const endDateInput = document.querySelector('#end-date');
const tBody = document.querySelector('tbody');

require([
  'esri/Map',
  'esri/views/MapView',
  'esri/layers/FeatureLayer',
], function (Map, MapView, FeatureLayer) {
  // Creación del mapa
  const map = new Map({
    basemap: 'streets', // mapa base
  });

  // Crear la vista del mapa
  const view = new MapView({
    container: 'map',
    map: map,
    zoom: 6,
    center: [-74.297333, 4.570868], // Coordenadas de centrado
  });

  // Cargar la capa desde el servicio proporcionado
  const featureLayer = new FeatureLayer({
    url: 'https://proyectos-seynekun.co/server/rest/services/SeguridadFisica/SF_PuntosGNSS/FeatureServer/0',
    outFields: ['ESN', 'FechaRecepcion'],
    definitionExpression: '',
  });

  // Añadir mapa
  map.add(featureLayer);

  // Añadir datos a la tabla
  const setDataToTable = (data) => {
    tBody.innerHTML = '';

    data.forEach((rowData) => {
      const { ESN, conteo } = rowData;
      const tr = document.createElement('tr');
      tr.innerHTML = `
            <th scope="row">${ESN}</th>
            <td>${conteo}</td>
        `;

      tBody.append(tr);
    });
  };

  // Verificar si la capa se carga correctamente
  featureLayer
    .when(() => {
      console.log('Layer loaded successfully.');
    })
    .catch((error) => {
      console.error('Error loading layer: ', error);
    });

  // Escuchar cambios en el campo de fecha inicial
  startDateInput.addEventListener('input', (event) => {
    const startDateValue = startDateInput.value.split('T');
    const endDateValue = endDateInput.value.split('T');

    // Mantener la fecha igual, pero permitir editar la hora en el campo de fecha final
    if (endDateValue[1]) {  // Si ya hay una hora seleccionada en endDateInput
      endDateInput.value = `${startDateValue[0]}T${endDateValue[1]}`; // Sincronizar solo la fecha
    } else {
      endDateInput.value = startDateInput.value; // Si no hay hora, sincroniza todo
    }
  });

  // Escuchar cambios en el campo de fecha final
  endDateInput.addEventListener('input', (event) => {
    const startDateValue = startDateInput.value.split('T');
    const endDateValue = endDateInput.value.split('T');

    // Siempre sincronizar la fecha del campo final con la del campo inicial, pero permitir cambiar la hora
    endDateInput.value = `${startDateValue[0]}T${endDateValue[1]}`;
  });

  filterBtn.addEventListener('click', async (event) => {
    const startDateValue = startDateInput.value.split('T');
    const endDateValue = endDateInput.value.split('T');

    // La expresión de filtro utiliza la misma fecha, pero permite diferentes horas
    featureLayer.definitionExpression = `FechaRecepcion>TIMESTAMP '${startDateValue[0]} ${startDateValue[1]}:00' AND FechaRecepcion<TIMESTAMP '${endDateValue[0]} ${endDateValue[1]}:00'`;
    featureLayer.refresh();

    const query = featureLayer.createQuery();
    query.groupByFieldsForStatistics = ['ESN'];
    query.returnGeometry = false;
    query.outStatistics = [
      {
        statisticType: 'count',
        onStatisticField: 'OBJECTID',
        outStatisticFieldName: 'conteo',
      },
    ];

    const result = await featureLayer.queryFeatures(query);
    const data = result.features.map((feature) => feature.attributes);
    setDataToTable(data);
  });
});
