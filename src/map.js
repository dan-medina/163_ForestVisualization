const width = 1000;
const height = 650;

var globalYear = 2020;
var globalCountry = "Afghanistan";

var mapSvg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

let data = new Map()

// Code for tooltip adapted from: (https://d3-graph-gallery.com/graph/bubblemap_tooltip.html)
// and (https://d3-graph-gallery.com/graph/interactivity_tooltip.html) (3/11/24).
var tooltip = d3.select("#map-container")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 1)
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

var mouseover = function(event, d) {
    tooltip
        .style("opacity", 1)
}

var mousemove = function(event, d) {
    console.log(d.properties.name, d.total)
    tooltip
        .html(d.properties.name + "<br>" + "Forest Area: " + Math.round(d.total*100)/100 + "%")
        .style("left", (event.pageX) + 10 + "px")
        .style("top", (event.pageY) - 10 + "px")
        .style("position", "absolute")
}

var mouseleave = function(event, d) {
    tooltip
        .style("opacity", 0)
}

function updateData(year){
    d3.csv("../data/esgdata_list.csv").then(function(loadData){
        countries = loadData;
        

    
        let series = "AG.LND.FRST.ZS";
        
        countries = countries.filter(d => {
            return (d.Time === year) && (d["Series Code"] === series)
        });

    
        countries.forEach(d => {
            data.set(d["Country Code"], +d.Value)
        })

        console.log(countries);

        let colorScale = d3.scaleLinear()
            .domain(d3.extent(countries, function(d) { return d.Value}))
             .range(["white", "darkgreen"])

        mapSvg.selectAll("path")
            .attr("fill", function(d) {
                d.total = data.get(d.id) || 0;
                return colorScale(d.total);
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

})}

// Code for choropleth map adapted from: (https://d3-graph-gallery.com/graph/choropleth_hover_effect.html) (3/11/24).
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("../data/esgdata_list.csv")
]).then(function(loadData) {
    let mapData = loadData[0];
    let countryData = loadData[1];
    // Temporarily hard-coded year.
    let year = "2020";
    let series = "AG.LND.FRST.ZS";

    countryData = countryData.filter(d => {
        return (d.Time === year) && (d["Series Code"] === series)
    });

    countryData.forEach(d => {
        data.set(d["Country Code"], +d.Value)
    })

    let colorScale = d3.scaleLinear()
    .domain(d3.extent(countryData, function(d) { return d.Value}))
    .range(["white", "darkgreen"])

    mapSvg.append("g")
        .selectAll("path")
        .data(mapData.features)
        .join("path")
        .attr("d", path)
        .attr("fill", function(d) {
            d.total = data.get(d.id) || 0;
            return colorScale(d.total);
        })
        .style("stroke", "gray")
        .attr("stroke-width", 0.1)
        .on("click", zoomIn)
        .on("dblclick", zoomOut)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

});

// Zoom in functionality adapted from: (https://gist.github.com/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2) (3/11/24).
function zoomIn(event, country) {
    globalCountry = country.properties.name;
    triggerRadarChartUpdate(globalYear);
    console.log("ZOOM IN CALLED")
    // console.log("COUNTRY: ", country);
    const bounds = path.bounds(country);
    const countryWidth = bounds[1][0] - bounds[0][0];
    const countryHeight = bounds[1][1] - bounds[0][1];
    const countryCenterX = (bounds[0][0] + bounds[1][0]) / 2;
    const countryCenterY = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.max(1, Math.min(15, 0.9 / Math.max(countryWidth / width, countryHeight / height)));
    const translate = [width / 2 - scale * countryCenterX, height / 2 - scale * countryCenterY];

    mapSvg.transition()
        .duration(750)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );

    if (d3.select(this).style("stroke") !== "rgb(0, 100, 0)"){
        d3.selectAll("path")
            .style("stroke", "gray")
            .attr("stroke-width", 0.1)
        d3.select(this)
            .raise()
            .transition()
            .duration(300)
            .style("stroke", "darkgreen")
            .attr("stroke-width", 0.5)
    }
}

// Zoom out will not work properly if user clicks on ocean.
function zoomOut(event) {
    event.stopPropagation();
    console.log("ZOOM OUT CALLED");
    mapSvg.transition()
        .duration(750)
        .call(
            zoom.transform, 
            d3.zoomIdentity
        );
    d3.selectAll("path")
        .transition()
        .duration(300)
        .style("stroke", "gray")
        .attr("stroke-width", 0.1)
}

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", function (event) {
        mapSvg.selectAll("path").attr("transform", event.transform);
    });
mapSvg.call(zoom);

// RADAR CHART
//
//
d3.csv("../data/esgdata_list.csv").then(function (r_data) {
    // Populate country selector
    const uniqueCountries = Array.from(new Set(r_data.map(d => d["Country Name"])));
    const countrySelector = document.getElementById('countrySelector');
    uniqueCountries.forEach(country => {
      let option = new Option(country, country);
      countrySelector.add(option);
    });
    
    countrySelector.addEventListener('change', function() {
        updateRadarChart(globalYear, globalCountry); // Call the function with the global year variable
      });

    // Populate statistics selectors
    const stats = Array.from(new Set(r_data.map(d => d["Series Name"])));
    const statSelectors = ['Stat1', 'Stat2', 'Stat3', 'Stat4', 'Stat5'];
    statSelectors.forEach(selectorId => {
      const selector = document.getElementById(selectorId);
      stats.forEach(stat => {
        let option = new Option(stat, stat);
        selector.add(option);
      });
    });
  
    const defaultStats = [
      "Access to clean fuels and technologies for cooking (% of population)",
      "Access to electricity (% of population)",
      "Agriculture, forestry, and fishing, value added (% of GDP)",
      "Agricultural land (% of land area)",
      "Forest area (% of land area)"
    ];
    let selectedCountriesHistory = [];
  
    statSelectors.forEach((selectorId, index) => {
      const selector = document.getElementById(selectorId);
      if (defaultStats[index]) {
        const defaultIndex = stats.findIndex(stat => stat === defaultStats[index]);
        if (defaultIndex !== -1) {
          selector.selectedIndex = defaultIndex;
        }
      }
  
      // Set default selected index
      if (defaultStats[index]) {
        const defaultIndex = stats.findIndex(stat => stat === defaultStats[index]);
        if (defaultIndex !== -1) {
          selector.selectedIndex = defaultIndex;
        }
      } else if (index < stats.length) { // Fallback to sequential defaults if specific ones aren't defined
        selector.selectedIndex = index;
      }
    });
  
    const tooltip = d3.select("#radarChart")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "20px")
      .style("padding", "5px")
      .style("pointer-events", "none");
  
    // Initialize SVG for radar chart
    const width = 700, height = 700;
    const margin = { top: 0, right: 100, bottom: 0, left: 100 };
    const radius = Math.min(width / 2, height / 2) - Math.max(...Object.values(margin));
    const svg = d3.select("#radarChart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);
  
    // Function to update and redraw the radar chart
    function updateRadarChart(num, country) {
        const selectedYear = num;
        const selectedCountry = country;
        const selectedStats = statSelectors.map(id => document.getElementById(id).value);

        const filteredData = r_data.filter(d => d["Country Name"] === selectedCountry && d["Time"] === selectedYear);
        const radarData = selectedStats.map(stat => {
            const statData = filteredData.find(d => d["Series Name"] === stat);
            let value;

        if (stat === "CO2 emissions (metric tons per capita)") {
          // Example normalization for CO2 emissions - assuming it needs to be scaled differently
          value = statData ? parseFloat(statData.Value) / 47.66 : 0; // Custom normalization
        } else if (stat === "Population density (people per sq. km of land area)") {
          // Apply different normalization for another series
          value = statData ? (Math.log(parseFloat(statData.Value)) - Math.log(1.4)) / (Math.log(18288.6) - Math.log(1.4)) : 0; // Custom normalization
        } else if (stat === "Food production index (2014-2016 = 100)") {
          // Apply different normalization for another series
          value = statData ? (parseFloat(statData.Value) - 3.08) / 575.63 : 0;
        } else {
          // Default normalization (assuming value is a percentage)
          value = statData ? parseFloat(statData.Value) / 100 : 0;
        }
  
        // Handle NaN, negative, and zero values
        let axisLabel = stat;
        if (isNaN(value)) {
          value = 0;
          axisLabel += " (N/A)";
        } else if (value < 0) {
          value = Math.abs(value); // Convert to absolute value
          axisLabel += " (negative)";
        } else if (value === 0) {
          axisLabel += " (N/A)";
        }
  
        return { axis: axisLabel, value: value };
      });
  
      // Additional check for NaN values - this might be redundant now but kept for safety
  
      drawRadarChart(radarData);
    }
  
    // Function to draw the radar chart
    function drawRadarChart(data) {
      svg.selectAll("*").remove(); // Clear previous chart
  
      const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);
      const angleSlice = Math.PI * 2 / data.length;
  
      // Draw the axes (lines)
      const axis = svg.selectAll(".axis")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "axis");
  
      axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "black")
        .style("stroke-width", "1px");
  
      // Draw the labels (axis names)
      axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(1.2) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(1.2) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d.axis);
  
      const ticks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
      ticks.forEach(tick => {
        axis.append("text")
          .style("font-size", "10px")
          .attr("text-anchor", (d, i) => i === 0 || i === data.length / 2 ? "middle" : i < data.length / 2 ? "start" : "end")
          .attr("x", (d, i) => (rScale(tick)) * Math.cos(angleSlice * i - Math.PI / 2))
          .attr("y", (d, i) => (rScale(tick)) * Math.sin(angleSlice * i - Math.PI / 2))
          .text(tick)
          .attr("alignment-baseline", "middle");
      });
  
      // Draw the radar chart area
      const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);
  
      // Create a wrapper for the radar chart area
      const radarArea = svg.append("path")
        .datum(data)
        .attr("d", radarLine)
        .attr("fill", "steelblue")
        .attr("fill-opacity", 0.1)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);
  
      // Optional: Add circles for data points
      data.forEach((d, i) => {
        svg.append("circle")
          .attr("cx", rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
          .attr("cy", rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
          .attr("r", 5)
          .style("fill", "steelblue")
          .on("mouseover", function (event, b) {
            tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            tooltip.html("Value: " + d.value) // Content of the tooltip
              .style("left", (event.pageX) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function (d) {
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
      });
    }
  
    // Event listeners for selectors
    [...document.querySelectorAll('.dropdown-container select'), countrySelector].forEach(selector => {
      selector.addEventListener('change', updateRadarChart(globalYear));
    });
    
    document.addEventListener('updateRadarChartEvent', function(e) {
        // Now passing both year and country to updateRadarChart
        updateRadarChart(e.detail.year, e.detail.country);
    });
    
    function normalizeValue(value, minValue, maxValue) {
      // Check if the value is NaN or 0
      if (value <= 0 || isNaN(value)) {
        return 0; // Return null or an appropriate error value
      }
  
      // Apply a logarithmic transformation
      const logValue = Math.log(value);
  
      // Assuming minValue and maxValue are the log-transformed minimum and maximum of the dataset
      // Normalize the log-transformed value to a 0-1 range
      const normalizedValue = (logValue - minValue) / (maxValue - minValue);
  
      return normalizedValue;
    }
    // Initial chart update
    updateRadarChart(globalYear, globalCountry);
  });

function triggerRadarChartUpdate(year) {
    var event = new CustomEvent('updateRadarChartEvent', { detail: { year: year, country: globalCountry } });
    document.dispatchEvent(event);
}
// RADAR CHART

d3.selectAll(".timeline").on("click", function() {
    var buttonText = d3.select(this).text();
    globalYear = buttonText;
    console.log(buttonText);
    updateData(buttonText);
    triggerRadarChartUpdate(buttonText);
});
