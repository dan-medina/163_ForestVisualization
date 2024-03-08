const width = 960;
const height = 1000;

var svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

let data = new Map()

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

Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("../data/esgdata_list.csv")
]).then(function(loadData) {
    let mapData = loadData[0];
    let countryData = loadData[1];

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

    svg.append("g")
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

function zoomIn(event, country) {
    console.log("ZOOM IN CALLED")
    // console.log("COUNTRY: ", country);
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
    svg.transition()
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
        svg.selectAll("path").attr("transform", event.transform);
    });
svg.call(zoom);
