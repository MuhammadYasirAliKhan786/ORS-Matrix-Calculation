$(document).ready(function() {

  const api_key = "YOUR_API_KEY";
  let inCalculation = false;
  let locations = [[50.81451, 4.3362],[50.84802, 4.34918],[50.85136, 4.35284],[50.819315, 4.372315],[50.83312, 4.38107],[50.826013, 4.302495],[50.83041, 4.37441],[50.83254, 4.37247],[50.8136, 4.3387],[50.81198, 4.3265],[50.82091, 4.3278],[50.80722, 4.3404],[50.80753, 4.3548],[50.81014, 4.3577],[50.81032, 4.3369],[50.82379, 4.3347]];

  //Lazy load the plugin to support right-to-left languages such as Arabic and Hebrew.
  maplibregl.setRTLTextPlugin(
      'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
      null,
      true 
  );
  
  let myToast = Toastify({
    text: "To be set before show!",
    newWindow: true,
    close: false,
    gravity: "top",
    position: "center",
    style: {
      borderBottom: 'thin solid',
      fontFamily: 'sans-serif',
      fontSize: 'x-large',
      textAlign: 'center',
      background: '#f03443'
    }
   });

  function showToast (text) {
      if (    myToast.toastElement == null
           || myToast.toastElement.className.search(" on") == -1) {
        myToast.options.text = text;
        myToast.showToast();
      }
      else if (    myToast.toastElement != null
                && myToast.myToast.options.text !== text) {
        myToast.hideToast();
        myToast.options.text = text;
        myToast.showToast();
      }        
  }

  const coordinate = L.latLng(49, 8.4);
  const map = new L.Map('map', {
    center: coordinate,
    zoom: 13,
    maxZoom: 18,
    zoomControl: false
  });
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const profiles = ['foot-walking'];

  addControls();

  addResultControl();
  addDescriptionBanner();
  
  function onMapClick(e) {
    if (inCalculation == true) {
        return;
    }
    if (locations.length < 4) {
      var title = "L"+ (locations.length + 1);
      const marker = L.marker(e.latlng).bindTooltip(title, { permanent: true, direction: 'top' }).addTo(map);

      locations.push(marker);
      marker.on('contextmenu', removeMarker);
    }
    else {
        showToast("Only 4 locations are allowed in this tutorial.");
    }
  }
  
  function renameMarkers() {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.unbindTooltip();
        var locationsIndex = locations.findIndex(l => l._latlng === layer._latlng);
        layer.bindTooltip('L'+(locationsIndex + 1), { permanent: true, direction: 'top' });
    }});
  }

  function removeMarker(e) {
    if (inCalculation == true) {
        return;
    }
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer._latlng === e.latlng) {
          layer.remove();
          clearMatrixPolygon();
          locations.splice(locations.findIndex(l => l._latlng === e.latlng), 1);
      }
    });
    renameMarkers();
  }

  function removeAllMarker() {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
          layer.remove();
      }
    });
  }


  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function startMatrixCalculation() {
    if (locations.length == 0) {
      return null;
    }
    else {
      return fetch(
        "https://api.openrouteservice.org/v2/matrix/foot-walking",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': '5b3ce3597851110001cf62480a855d77031c43538bc8553cf7fbff18'
            // 'apiKey': api_key
          },
          body: getMatrixBody()
        }
      ).then((response) => response.ok ? response.json() : console.log(response))
    }
  }

  // polls the status until it is not "RUNNING" any more
  // async function getMatrixCalculationStatus(requestId) {
  //   var status = "RUNNING";
  //   await sleep(25);
  //   while (status == "RUNNING") {
  //     fetch(
  //         "https://api.myptv.com/matrixrouting/v1/matrices/status/" + requestId,
  //         {
  //           method: 'GET',
  //           headers: {
  //             'Content-Type': 'application/json',
  //             'apiKey': api_key
  //           }
  //         }
  //     )
  //     .then((response) => response.json()
  //         .then((result) => {
  //           status = result.status;
  //         })
  //         .catch(err => {console.log(err.message); status = "raushier";})
  //     );
  //     if (status == "RUNNING") {
  //         await sleep(100);
  //     }
  //   }
  //   return status;
  // }

  // function getMatrixResult(requestId) {
  //   fetch(
  //       "https://api.myptv.com/matrixrouting/v1/matrices/" + requestId,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'apiKey': api_key
  //         }
  //       }
  //   )
  //   .then((response) => response.json()
  //       .then((result) => {
  //           displayMatrixPolyline();
  //           displayMatrixResults(result);
  //       })
  //       .catch(err => console.log(err.message)))
  // }

  async function calculateMatrixAsynchronous() {
    inCalculation = true;
    document.getElementById('btnSendRequest').disabled = true;
    document.getElementById('btnResetEverything').disabled = true;
    document.body.style.cursor  = 'wait';
    
    clearResults();
    const result = await startMatrixCalculation();
    // if (responseStart == null) {
    //   document.body.style.cursor  = 'default';
    //   document.getElementById('btnSendRequest').disabled = false;
    //   document.getElementById('btnResetEverything').disabled = false;
    //   inCalculation = false;
    //   return;
    // }
    // var status = await getMatrixCalculationStatus(responseStart.id);
    // if (status !== "SUCCEEDED") {
    //   showToast("calculation status: " + status);
    // }
    // else {
    //   getMatrixResult(responseStart.id);
    // }
    if (result) {
      // displayMatrixPolyline();
      displayMatrixResults(result);
    }

    document.body.style.cursor  = 'default';
    document.getElementById('btnSendRequest').disabled = false;
    document.getElementById('btnResetEverything').disabled = false;
    inCalculation = false;
  }
  
  function getMatrixParameter() {
    getDistances = document.getElementById('cb_distances').checked;
    getTravelTimes = document.getElementById('cb_travelTimes').checked;
    getTollCosts = document.getElementById('cb_tollCosts').checked;

    let query = '?profile=' + document.getElementById('vehicleProfile').value;

    if (getDistances != true && getTravelTimes != true && getTollCosts != true) {
      console.log('now the default takes effect');
    }
    else
    {
      query += '&results=';
      var first = true;
      if (getDistances) {
        query += document.getElementById('cb_distances').value;
        first = false;
      }
      if (getTravelTimes) {
        if (!first) {
          query += ',';}
        query += document.getElementById('cb_travelTimes').value;
        first = false;
      }
      if (getTollCosts) {
        if (!first) {
          query += ',';}
        query += document.getElementById('cb_tollCosts').value;
      }
    }      
    return query;
  }

  function getMatrixBody() {
    let body = '{"locations": [';
    position = 0;  
    locations.forEach((location) => {
      if (position != 0) {
        body += ','; }
      body += '['+location[1]+','+location[0]+']';
      position += 1;
    });
    body += ']';
    body += ',"destinations":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],"metrics":["distance","duration"],"sources":[0],"units":"km"}';
    console.log(body);
    return body;
  }

  let matrixPolygon = null;
  function displayMatrixPolyline(polyline) {

    const myStyle = {
      'color': '#2882C8',
      'weight': 10,
      'opacity': 0.65
    };

    let latlngs = [];
    for (let idxSource = 0; idxSource < locations.length; idxSource++) {
      latlngs.push(locations[idxSource]._latlng);
      for (let idxDest = idxSource + 1; idxDest < locations.length; idxDest++) {
        latlngs.push(locations[idxDest]._latlng);
        latlngs.push(locations[idxSource]._latlng);
      }
    }

    matrixPolygon = L.polyline(latlngs, myStyle).addTo(map);;
    map.fitBounds(matrixPolygon.getBounds(), { padding: [50, 50] });
  }

  
  function clearMatrixPolygon() {
    if (matrixPolygon !== null) {
      map.removeLayer(matrixPolygon);
    }
  }

  function clearResults() {
    clearMatrixPolygon();
    
    $('#distancesTable').empty();
    $('#traveTimeTable').empty();
    $('#tollCostTable').empty();
    $('#lblPercentageOfDirectDistanceRelations').html('');
  }

  function clearResultsAndLocations() {
    clearResults();
    removeAllMarker();
    locations.length = 0;
  }
  

  function convertTime(time) {
    const hours = time / 60 / 60;
    const rhours = Math.trunc(hours);
    const minutes = (time - (rhours*60*60)) / 60;
    const rminutes = Math.trunc(minutes);
    const seconds = time % 60;
    
    var sminutes = '0';
    if (rminutes >= 10) {
        sminutes = rminutes;
    }
    else {
        sminutes += rminutes;
    }

    var sseconds = '0';
    if (seconds >= 10) {
        sseconds = seconds;
    }
    else {
        sseconds += seconds;
    }

    return rhours + ':' + sminutes + ':' + sseconds;
  }

  function getRow(columns) {
    let row = '';
    columns.forEach((col) => {
      row += '<td>' + col + '</td>';
    });
    return '<tr>' + row + '</tr>';
  }

  function displayMatrixResults(result) {
    console.log("Results: ", result);
    // put request on page
    const request = getMatrixBody();
    document.getElementById("request").innerText = JSON.stringify(
      request,
      null,
      2,
    );
    document.getElementById("response").innerText = JSON.stringify(
      result,
      null,
      2,
    );
    // if (document.getElementById("cb_distances").checked) {
    //   cols = [];
    //   cols[0]='';
    //   for (run = 1; run <= locations.length; run++) {
    //     cols[run] = 'L' + (run);
    //   }
    //   row = getRow(cols);
    //   $('#distancesTable').append(row);

    //   const distances = result.distances;
    //   i = 0; j = 1;
    //   distances.forEach((distance) => {
    //     if (i == 0) {
    //       cols[0] = 'L' + j;
    //       j++;
    //     }
    //     i++;
    //     diagonal = (i+1) == j && distance == 0;
    //     if (diagonal) {
    //       cols[i] = '-';
    //     }
    //     else {
    //       cols[i] = (distance/1000).toFixed(3);
    //     }
    //     if ( i%(locations.length) == 0) {
    //       i = 0;
    //       row = getRow(cols);
    //       $('#distancesTable').append(row);   
    //     }
    //   });
    // }

    // // traveltimes are default, so we get them also, if nothing is activated. Nevertheless we only show them if wanted.
    // if (document.getElementById("cb_travelTimes").checked) {
    //   cols = [];
    //   cols[0]='';
    //   for (run = 1; run <= locations.length; run++) {
    //     cols[run] = 'L' + (run);
    //   }
    //   row = getRow(cols);
    //   $('#traveTimeTable').append(row);

    //   const travelTimes = result.travelTimes;
    //   i = 0; j = 1;
    //   travelTimes.forEach((travelTime) => {
    //     if (i == 0) {
    //       cols[0] = 'L' + j;
    //       j++;
    //     }
    //     i++;
    //     diagonal = (i+1) == j && travelTime == 0;
    //     if (diagonal) {
    //       cols[i] = '-';
    //     }
    //     else {
    //       cols[i] = convertTime(travelTime);
    //     }
    //     if ( i%(locations.length) == 0) {
    //       i = 0;
    //       row = getRow(cols);
    //       $('#traveTimeTable').append(row);   
    //     }
    //   });
    // }

    // if (document.getElementById("cb_tollCosts").checked) {
    //   cols = [];
    //   cols[0]='';
    //   for (run = 1; run <= locations.length; run++) {
    //     cols[run] = 'L' + (run);
    //   }
    //   row = getRow(cols);
    //   $('#tollCostTable').append(row);

    //   const tollCosts = result.tollCosts;
    //   i = 0; j = 1;
    //   tollCosts.forEach((tollCost) => {
    //     if (i == 0) {
    //       cols[0] = 'L' + j;
    //       j++;
    //     }
    //     i++;
    //     diagonal = (i+1) == j && tollCost == 0;
    //     if (diagonal) {
    //       cols[i] = '-';
    //     }
    //     else {
    //       cols[i] = (Math.floor(tollCost * 100) / 100).toFixed(2);
    //     }
    //     if ( i%(locations.length) == 0) {
    //       i = 0;
    //       row = getRow(cols);
    //       $('#tollCostTable').append(row);   
    //     }
    //   });
    // }

    // $('#lblPercentageOfDirectDistanceRelations').html(result.percentageOfDirectDistanceRelations + ' %');
  }

  function addControls() {
    const routingControl = L.control({position: 'topleft'});
    routingControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'routing-control');
      const html = `
          <h2>Options</h2>
          <div>
              <div>
                  <label for="vehicleProfile" style="display: block;">Vehicle Profile</label>
                  <select name="vehicleProfile" id="vehicleProfile" style="display: block; width: 100%;">
                      ${
                          profiles.map((profile)=>{
                              return `<option value="${profile/*.name*/}">${profile/*.name*/}</option>`;
                          })
                      }
                  </select>
              </div>
              <br />
              <div>
              <input class="checkbox-type" type="checkbox" id="cb_distances" checked="true" value="DISTANCES" />
              <label for="distances">DISTANCES</label>
              </div>
              <div>
                <input class="checkbox-type" type="checkbox" id="cb_travelTimes" checked="true" value="TRAVEL_TIMES" />
                <label for="travelTimes">TRAVEL_TIMES</label>
              </div>
              <div>
                <input class="checkbox-type" type="checkbox" id="cb_tollCosts" checked="true" value="TOLL_COSTS" />
                <label for="toll costs">TOLL_COSTS</label>
              </div>
              <br />
              <h2>Request</h2>
              <button type="button" id="btnSendRequest" class="calc-btn">calculate matrix</button>
              <h2>Reset</h2>
              <button type="button" id="btnResetEverything" class="calc-btn">reset locations and results</button>
          </div>
  `;
      div.innerHTML = html;

      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      return div;
    };
    routingControl.addTo(map);
    document.getElementById('btnSendRequest').addEventListener('click', calculateMatrixAsynchronous);
    document.getElementById('btnResetEverything').addEventListener('click', clearResultsAndLocations);
  }

  // UI controls
  function addResultControl() {
    const resultControl = L.control({position: 'topright'});
    resultControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'result-control');
      const html = `
          <h2>Results</h2>
          <div id="ResultsWrapper">
              <h3>distances (km)</h3>
              <table id="distancesTable"></table>
              <h3>travel times (h:min:sec)</h3>
              <table id="traveTimeTable"></table>
              <h3>toll costs (EUR)</h3>
              <table id="tollCostTable"></table>
              <h3>direct-distance relations</h3>
              <label id="lblPercentageOfDirectDistanceRelations"></label>
          </div>
      `;
      div.innerHTML = html;

      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      return div;
    };
    resultControl.addTo(map);
  }

  function addDescriptionBanner() {
    const banner = L.control({position: 'bottomleft'});
    banner.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'banner');
      const html = `
          <p>
              Left click to add up to 4 locations. Right click on a location will remove it.<br>
              The location order is determined by the order of their creation.
          </p>
      `;
      div.innerHTML = html;

      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      return div;
    };
    banner.addTo(map);
  }
});