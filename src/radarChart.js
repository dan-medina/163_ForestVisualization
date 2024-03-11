d3.csv("esgdata_list.csv").then(function (data) {
  // Populate country selector
  const uniqueCountries = Array.from(new Set(data.map(d => d["Country Name"])));
  const countrySelector = document.getElementById('countrySelector');
  uniqueCountries.forEach(country => {
    let option = new Option(country, country);
    countrySelector.add(option);
  });

  // Populate year selector
  const yearSelector = document.getElementById('yearSelector');
  for (let year = 1992; year <= 2020; year++) {
    let option = new Option(year, year);
    yearSelector.add(option);
  }

  // Populate statistics selectors
  const stats = Array.from(new Set(data.map(d => d["Series Name"])));
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

  const tooltip = d3.select("body").append("div")
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
  function updateRadarChart() {
    const selectedYear = yearSelector.value;
    const selectedCountry = countrySelector.value;
    const selectedStats = statSelectors.map(id => document.getElementById(id).value);

    const filteredData = data.filter(d => d["Country Name"] === selectedCountry && d["Time"] === selectedYear);
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
        .on("mouseover", function(event, b) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html("Value: " + d.value) // Content of the tooltip
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
    });
  }

  // Event listeners for selectors
  [...document.querySelectorAll('.dropdown-container select'), yearSelector, countrySelector].forEach(selector => {
    selector.addEventListener('change', updateRadarChart);
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
  updateRadarChart();
});