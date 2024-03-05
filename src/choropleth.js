const width = 960;
const height = 1000;

const svg = d3.select("#map-container")
  .attr("width", width)
  .attr("height", height)

const projection = d3.geoMercator()
  .scale(150)
  .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(data) {
  svg.append("g")
    .selectAll("path")
    .data(data.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#004236")
    .style("stroke", "white")
    .attr("stroke-width", 0.1)
    .on("click", zoomIn)
    .on("dblclick", zoomOut);
});

function zoomIn(event, country) {
    console.log("ZOOM IN CALLED")
    const bounds = path.bounds(country);
    const countryWidth = bounds[1][0] - bounds[0][0];
    const countryHeight = bounds[1][1] - bounds[0][1];
    const countryCenterX = (bounds[0][0] + bounds[1][0]) / 2;
    const countryCenterY = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.max(1, Math.min(15, 0.9 / Math.max(countryWidth / width, countryHeight / height)));
    const translate = [width / 2 - scale * countryCenterX, height / 2 - scale * countryCenterY];

    svg.transition()
        .duration(750)
        .call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
}

// Zoom out will not work properly if user clicks on ocean.
function zoomOut(event) {
    event.stopPropagation();
    console.log("ZOOM OUT CALLED");
    svg.transition()
        .duration(750)
        .call(
            zoom.transform, 
            d3.zoomIdentity
        );
}

const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on("zoom", function (event) {
    svg.selectAll("path").attr("transform", event.transform);
  });
svg.call(zoom);
