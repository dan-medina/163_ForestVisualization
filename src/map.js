const width = 900;
const height = 800;

const width2 = 910;
const height2 = 60;

var globalYear = "1992";
var globalCountry = "Afghanistan";

var mapSvg = d3.select("#map-container")
  .style("border-radius", "50%")
  .attr("width", "50%")
  .style("overflow", "hidden")
  .style("border", "2px solid darkgreen")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background-color", "#c5e0f5");

var buttonSvg = d3.select("#buttons")
  .append("svg")
  .attr("width", width2)
  .attr("height", height2)
  .attr("class","timeline1")
  
  

const projection = d3.geoMercator()
  .scale(150)
  .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

let rawCountryData = [];

let selectedCountries = [];
selectedCountries.push("United States");

let data = new Map()

// Code for tooltip adapted from: (https://d3-graph-gallery.com/graph/bubblemap_tooltip.html)
// and (https://d3-graph-gallery.com/graph/interactivity_tooltip.html) (3/11/24).
var tooltip = d3.select("#map-container")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")

var tooltip2 = d3.select("#buttons")
  .append("div")
  .attr("class", "tooltip2")
  .style("opacity", 0)
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")


var mouseover = function (event, d) {
  tooltip
    .style("opacity", 1)
}

var mousemove = function (event, d) {
  // console.log(d.properties.name, d.total)
  tooltip
    .html(d.properties.name + "<br>" + "Forest Area: " + Math.round(d.total * 100) / 100 + "%")
    .style("left", (event.pageX) + 10 + "px")
    .style("top", (event.pageY) - 10 + "px")
    .style("position", "absolute")
}

var mouseleave = function (event, d) {
  tooltip
    .style("opacity", 0)
}

function updateData(year) {
  d3.csv("../data/esgdata_list.csv").then(function (loadData) {
    console.log(year)
    year = year.toString();
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
      .domain(d3.extent(countries, function (d) { return d.Value }))
      .range(["white", "darkgreen"])
    d3.select("#radarChart").select("svg").selectAll(".currYear")
      .text("Current year: " + year)

    mapSvg.selectAll("path")
      .transition()
      .duration(500)
      .attr("fill", function (d) {
        d.total = data.get(d.id) || 0;
        return colorScale(d.total);
      })
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

  })
}

// Code for choropleth map adapted from: (https://d3-graph-gallery.com/graph/choropleth_hover_effect.html) (3/11/24).
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("../data/esgdata_list.csv")
]).then(function (loadData) {
  let mapData = loadData[0];
  let countryData = loadData[1];

  rawCountryData = countryData;
  // Temporarily hard-coded year.
  let year = "1992";
  let series = "AG.LND.FRST.ZS";

  countryData = countryData.filter(d => {
    return (d.Time === year) && (d["Series Code"] === series)
  });

  countryData.forEach(d => {
    data.set(d["Country Code"], +d.Value)
  })

  let colorScale = d3.scaleLinear()
    .domain(d3.extent(countryData, function (d) { return d.Value }))
    .range(["white", "darkgreen"])

  mapSvg.append("g")
    .selectAll("path")
    .data(mapData.features)
    .join("path")
    .attr("d", path)
    .attr("fill", function (d) {
      d.total = data.get(d.id) || 0;
      return colorScale(d.total);
    })
    .style("stroke", "gray")
    .attr("stroke-width", 0.1)
    .on("click", zoomIn)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  d3.select(window)
    .on("keydown", function(event) {
      if (event.key === "Escape" || event.key === "p"){
        console.log("Z KEY PRESSED")
        zoomOut(event);
      }
    })

  // Map gradient legend adapted from (https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient/) (3/13/24).
  let defs = mapSvg.append("defs");

  let mapLegend = defs.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%")

  mapLegend.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "white")

  mapLegend.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "darkgreen");

  let legendX = 225;
  let legendY = 710;
  let legendWidth = 400;
  let legendHeight = 20;

  mapSvg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)")
    .style("stroke", "gray")

  mapSvg.append("text")
    .attr("x", legendX + legendWidth / 3)
    .attr("y", legendY - 5)
    .text("Forest Area (% of land area)")
    .style("font-size", "10px")
  mapSvg.append("text")
    .attr("x", legendX - 5)
    .attr("y", legendY + 30)
    .text("0%")
    .style("font-size", "10px")

  mapSvg.append("text")
    .attr("x", legendX + legendWidth / 5)
    .attr("y", legendY + 30)
    .text("20%")
    .style("font-size", "10px")

  mapSvg.append("text")
    .attr("x", legendX + legendWidth * 2 / 5)
    .attr("y", legendY + 30)
    .text("40%")
    .style("font-size", "10px")

  mapSvg.append("text")
    .attr("x", legendX + legendWidth * 3 / 5)
    .attr("y", legendY + 30)
    .text("60%")
    .style("font-size", "10px")
  
  mapSvg.append("text")
    .attr("x", legendX + legendWidth * 4 / 5)
    .attr("y", legendY + 30)
    .text("80%")
    .style("font-size", "10px")
  
  mapSvg.append("text")
    .attr("x", legendX - 5 + legendWidth)
    .attr("y", legendY + 30)
    .text("100%")
    .style("font-size", "10px")

});

function getCountryName(countryCode) {
  let countries = rawCountryData.filter(d => {
    return (d["Country Code"] == countryCode)
  })

  return countries[0]["Country Name"];

}

// Zoom in functionality adapted from: (https://gist.github.com/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2) (3/11/24).
function zoomIn(event, country) {

  let countryName = getCountryName(country.id);

  if(!selectedCountries.includes(countryName)){
    if(selectedCountries.length >= 3){
      selectedCountries.shift()
      selectedCountries.push(countryName)
    } else {
      selectedCountries.push(countryName)
    }
  }
  // globalCountry = getCountryName(country.id)
  console.log("ZOOM IN CALLED")
  // console.log("COUNTRY: ", country);
  const bounds = path.bounds(country);
  const countryWidth = bounds[1][0] - bounds[0][0];
  const countryHeight = bounds[1][1] - bounds[0][1];
  const countryCenterX = (bounds[0][0] + bounds[1][0]) / 2;
  const countryCenterY = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.max(1, Math.min(15, 0.7 / Math.max(countryWidth / width, countryHeight / height)));
  const translate = [width / 2 - scale * countryCenterX, height / 2 - scale * countryCenterY];

  mapSvg.transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );

  if (d3.select(this).style("stroke") !== "rgb(0, 100, 0)") {
    mapSvg.selectAll("path")
      .style("stroke", "gray")
      .attr("stroke-width", 0.1)
    d3.select(this)
      .raise()
      .transition()
      .duration(300)
      .style("stroke", "darkgreen")
      .attr("stroke-width", 0.5)
  }
  triggerRadarChartUpdate(globalYear);
}

function zoomOut(event) {
  event.stopPropagation();
  console.log("ZOOM OUT CALLED");
  mapSvg.transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity
    );
  mapSvg.selectAll("path")
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
//--------------------------------------------------------------------------------------------------
// RADAR CHART
//
//
d3.csv("../data/esgdata_list.csv").then(function (r_data) {
  // Populate country selector
  // const uniqueCountries = Array.from(new Set(r_data.map(d => d["Country Name"])));
  // uniqueCountries.forEach(country => {
  //   let option = new Option(country, country);
  // });

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
    selector.addEventListener('change', function () {
      triggerRadarChartUpdate(globalYear); // Use the global year variable
    });
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
  const width = 700, height = 760;
  const margin = { top: 50, right: 100, bottom: 0, left: 100 };
  const radius = Math.min(width / 2, height / 2) - Math.max(...Object.values(margin));
  const svg = d3.select("#radarChart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${width / 2 + margin.left},${height / 2 + margin.top})`)
      



  const countryNameText = svg.append("text")
    .attr("class", "countryName") // Add a class for potential styling
    .attr("transform", `translate(0, ${-height / 2 + margin.top})`) // Adjust this to position the text
    .attr("text-anchor", "middle") // Center the text
    .style("font-size", "16px") // Style as needed
    .text(`Selected Country: ${selectedCountries[selectedCountries.length - 1]}`);

  d3.select("#radarChart").select("svg").append("text")
    .attr("class", "currYear") // Use for selection and potential styling
    .attr("x", width/2 + 300) // Center the title
    .attr("y", 60) // Position it at the top of the chart
    .attr("text-anchor", "middle") // Ensure it's centered
    .style("font-size", "18px") // Style as needed
    .text(`Current year: ${globalYear}`); // Set the text to the current country


  function updateChartTitle() {
    const svg = d3.select("#radarChart").select("svg");
    // Remove any existing title to prevent duplicates
    svg.select(".radar-chart-title").remove();

    // Append a new title text element
    svg.append("text")
      .attr("class", "radar-chart-title") // Use for selection and potential styling
      .attr("x", width / 2 + margin.left) // Center the title
      .attr("y", 60) // Position it at the top of the chart
      .attr("text-anchor", "middle") // Ensure it's centered
      .style("font-size", "24px") // Style as needed
      .text(`Selected Country: ${selectedCountries[selectedCountries.length - 1]}`); // Set the text to the current country

    if (selectedCountries.length > 1){
      svg.select(".radar-chart-subtitle").remove();
      svg.append("text")
      .attr("class", "radar-chart-subtitle")
      .attr("x", width / 2 + margin.left)
      .attr("y", 100)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .text(() => {
        if (selectedCountries.length == 2){
          return "Recently selected countries: " + selectedCountries[0]
        }else {
          return "Recently selected countries: " + selectedCountries[1] + ", " + selectedCountries[0]
        }
      })
    }
    svg.select(".currYear").remove()
    svg.append("text")
      .attr("class", "currYear") // Use for selection and potential styling
      .attr("x", width/2 + 400) // Center the title
      .attr("y", 60) // Position it at the top of the chart
      .attr("text-anchor", "middle") // Ensure it's centered
      .style("font-size", "18px") // Style as needed
      .text(`Current year: ${globalYear}`); // Set the text to the current country
    
  }

  // Function to update and redraw the radar chart
  function updateRadarChart(num, countries) {
    console.log("UPDATE RADAR CHART CALLED");
    console.log("UPDATE YEAR: ", num)
    const selectedYear = num;
    // const selectedCountry = country;
    const selectedStats = statSelectors.map(id => document.getElementById(id).value);

    // let testCountry = "Germany";
    // countryList = [];
    // countryList.push(selectedCountry);
    // countryList.push(testCountry);
    console.log("COUNTRY LIST: ", countries);
    let radarDataList = {};
    countries.forEach(country => {
      const filteredData = r_data.filter(d => d["Country Name"] === country && d["Time"] === selectedYear);
      console.log("FILTERED DATA: ", filteredData);
      const radarData = selectedStats.map(stat => {
        const statData = filteredData.find(d => d["Series Name"] === stat);
        console.log("STAT DATA: ", statData);
        let value;

        if (stat === "CO2 emissions (metric tons per capita)") {
          value = statData ? parseFloat(statData.Value) / 47.66 : 0;
        } else if (stat === "Population density (people per sq. km of land area)") {
          value = statData ? (Math.log(parseFloat(statData.Value)) - Math.log(1.4)) / (Math.log(18288.6) - Math.log(1.4)) : 0;
        } else if (stat === "Food production index (2014-2016 = 100)") {
          value = statData ? (Math.log(parseFloat(statData.Value)) - Math.log(3.08)) / (Math.log(578.71) - Math.log(3.08)) : 0;
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

      radarDataList[country] = radarData;
    })
    // Additional check for NaN values - this might be redundant now but kept for safety
    console.log("RADAR DATA LIST: ", radarDataList);
    updateChartTitle();
    drawRadarChart(radarDataList);
  }

  // Function to draw the radar chart
  function drawRadarChart(data) {
    svg.selectAll("*").remove(); // Clear previous chart
    console.log("RADAR DATA: ", data);

    let firstDataObject = data[Object.keys(data)[0]];

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);
    const angleSlice = Math.PI * 2 / firstDataObject.length;
    // console.log(data[Object.keys(data)[0]].length)
    // Draw the axes (lines)
    const axis = svg.selectAll(".axis")
      .data(firstDataObject)
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
        .attr("text-anchor", (d, i) => i === 0 || i === firstDataObject.length / 2 ? "middle" : i < firstDataObject.length / 2 ? "start" : "end")
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

    let radarColors = ["darkseagreen", "olive", "darkgreen"]
    // Create a wrapper for the radar chart area
    svg.selectAll(".radar-legend").remove()

    for(const [country, radarData] of Object.entries(data)) {
      console.log("FOR RADAR DATA: ", radarData);
      let radarColor = radarColors[selectedCountries.indexOf(country)]
      const radarArea = svg.append("path")
      .datum(radarData)
      .transition()
      .duration(500)
      .attr("d", radarLine)
      .attr("fill", radarColor)
      .attr("fill-opacity", 0.1)
      .attr("stroke", radarColor)
      .attr("stroke-width", 2);

      // Optional: Add circles for data points
      radarData.forEach((d, i) => {
        svg.append("circle")
          // console.log("D: ", d.value)
          // console.log("I: ", i)
          // console.log("RSCALE: ", rScale(d.value))
          // console.log("ANGLE SLICE: ", angleSlice)
          // .transition()
          // .duration(100)
          .attr("cx", rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
          .attr("cy", rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
          .attr("r", 5)
          .style("opacity", 0)
          .style("fill", radarColor)
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
      
      svg.append("rect")
        .transition()
        .duration(500)
        .attr("class", "radar-legend")
        .attr("x", 250)
        .attr("y", selectedCountries.indexOf(country) * 25)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", radarColor)
      svg.append("text")
        .transition()
        .duration(500)
        .attr("class", "radar-legend")
        .attr("x", 250 + 24)
        .attr("y", selectedCountries.indexOf(country) * 25 + 12)
        .text(country)
        .attr("text-anchor", "left")
        .style("font-size", "10px")
    }
    
    svg.selectAll("circle")
      .transition()
      .duration(100)
      .style("opacity", 1)
  }

  document.addEventListener('updateRadarChartEvent', function (e) {
    // Now passing both year and country to updateRadarChart
    updateRadarChart(e.detail.year, e.detail.countries);
  });
  // Initial chart update
  updateRadarChart(globalYear, selectedCountries);
});

function triggerRadarChartUpdate(year) {
  console.log("YEAR: ", year)
  var event = new CustomEvent('updateRadarChartEvent', { detail: { year: year, countries: selectedCountries } });
  document.dispatchEvent(event);
}

/*
d3.selectAll(".timeline").on("click", function() {
    var buttonText = d3.select(this).text();
    globalYear = buttonText;
    console.log(buttonText);
    updateData(buttonText);
    triggerRadarChartUpdate(buttonText);
});
*/
const containerWidth = document.querySelector(".timeline1").clientWidth;

const scale = d3.scaleLinear()
  .domain([1992, 2020])
  .range([10, containerWidth * 0.98]);



//Re-purposed old buttons into timeline

buttonSvg.append("g")

  .call(d3.axisBottom(scale).ticks(28).tickFormat(d3.format("d")))
  .selectAll("text")
  .on("click", function (d) {
    //updateData(d.target.__data__);

    var buttonText = d3.select(this).text()
    globalYear = buttonText;
    updateData(buttonText);
    triggerRadarChartUpdate(buttonText);


  })
  .on("mouseover", function (d) {
    d3.select(this).attr("fill", "blue");
    d3.select(this).attr("cursor", "pointer");
    if (facts[d3.select(this).text()] === undefined){
        tooltip2
        .style("opacity", 0)
        
    }
    else{
        tooltip2
        .style("opacity", 1)

    }

  })
  .on("mouseout", function (d) {
    d3.select(this).attr("fill", "black");
    d3.select(this).attr("cursor", "default");
    tooltip2
      .style("opacity", 0)
  })
  .on("mousemove", function (event, d) {
    console.log(event.pageX)
    tooltip2
      .html(facts[d3.select(this).text()].replace(/\n/g,'<br>'))
      .style("font-size","12px")
      .style("left", (event.pageX) + 10 + "px")
      .style("top", (event.pageY) + 20 + "px")
      .style("position", "absolute")
  })



const facts = {
    "1995": "- The Brazilian government grants forest land to ~150,000 families in the Amazon from 1995 - 1998. \n- Poor farmers encouraged by the INCRA to farm and industrialize unclaimed forest land, which nearly 50% of deforestation in Brazil that year is caused by.",
    "2017": "- Brazil allocates 46,000 sq miles (120,000 km2) for Amazon deforestation to lure foreign mining investors.",
    "2003": "- In 2003, over 20% of the forests of Mato Grosso, Brazil turned into cropland for soy and various other crops.",
    "2004": "- Amazonian Deforestation rates peaked in 2004 at 27,423 square kilometers per year. \n- Most of the deforested land from 2001 - 2004 was being used for cattle ranching and growing crops.",
    "2019": "- Huge wildfires occur all throughout the Amazon Rainforest, causing deforestation rates of this year to bump up quite a lot.\n- Most were discovered to be caused by illegal land clearing not natural factors\n - 2019 now ranks among the lowest ice minimums in the 40-year satellite record.",
    "2012": "- Indonesia's rate of deforestation continued to increase to an estimated 840,000 hectares in 2012, surpassing deforestation in Brazil. \n-Mostly can be attributed to clearing of land for palm-oil and other industrial plantations, as well as agriculture.",
    "2018": "- More than 80% of deforestation was attributed to agriculture in 2018.",
    "2011": "- Data reveals that global CO₂ emissions were 150 times higher in 2011 than they were in 1850.",
    "2020": "- 2020 ranks as the second-hottest year on record for the planet, followed in second by 2016."



};
