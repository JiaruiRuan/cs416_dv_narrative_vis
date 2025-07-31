let currentScene = 0;
let data;
const stateAbbreviations = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY"
};


const margin = { top: 50, right: 160, bottom: 80, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#vis")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.csv("data/us-states.csv", d3.autoType).then(csv => {
  data = csv;
  updateScene(currentScene);
});

d3.select("#next").on("click", () => {
  currentScene = Math.min(currentScene + 1, 3);
  updateScene(currentScene);
});

d3.select("#prev").on("click", () => {
  currentScene = Math.max(currentScene - 1, 0);
  updateScene(currentScene);
});

function updateScene(scene) {
  svg.selectAll("*").remove();

  if (scene === 0) {
    d3.select("#stateDropdown").style("display", "none");
    drawNationalLineChart();
  } else if (scene === 1) {
    d3.select("#stateDropdown").style("display", "none");
    drawStateComparison();
  } else if (scene === 2) {
    d3.select("#stateDropdown").style("display", "none");
    drawScatterPlot();
  } else if (scene === 3) {
    d3.select("#stateDropdown").style("display", "inline");
    initDropdown();
    drawSelectedState(d3.select("#stateDropdown").property("value"));
  }
}

function drawNationalLineChart() {
  const dateMap = d3.rollup(
    data,
    v => d3.sum(v, d => d.cases),
    d => d.date
  );
  const aggregated = Array.from(dateMap, ([date, cases]) => ({ date, cases }))
    .sort((a, b) => d3.ascending(a.date, b.date));

  const x = d3.scaleTime()
    .domain(d3.extent(aggregated, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.cases)])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %Y"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("path")
    .datum(aggregated)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d.date))
      .y(d => y(d.cases))
    );

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text("U.S. Total COVID-19 Cases Over Time");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "gray")
    .text("Major waves: Summer 2020, Winter 2021, Late 2021");
}


function drawStateComparison() {
  const statesToShow = ["California", "Texas", "Florida", "New York", "Washington"];
  const filtered = data.filter(d => statesToShow.includes(d.state));
  const nested = d3.group(filtered, d => d.state);

  const color = d3.scaleOrdinal()
    .domain(statesToShow)
    .range(d3.schemeTableau10);

  const x = d3.scaleTime()
    .domain(d3.extent(filtered, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.cases)])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %Y"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  for (let [state, values] of nested.entries()) {
    values.sort((a, b) => d3.ascending(a.date, b.date));
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.cases));
    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color(state))
      .attr("stroke-width", 2)
      .attr("d", line);
  }

  statesToShow.forEach((state, i) => {
    svg.append("circle")
      .attr("cx", width + 20)
      .attr("cy", 20 + i * 20)
      .attr("r", 6)
      .attr("fill", color(state));

    svg.append("text")
      .attr("x", width + 30)
      .attr("y", 24 + i * 20)
      .text(state)
      .attr("font-size", "14px")
      .attr("alignment-baseline", "middle");
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text("COVID-19 Case Trends for Selected States");

  svg.append("line")
    .attr("x1", x(new Date("2021-01-01")))
    .attr("x2", x(new Date("2021-01-01")))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "gray")
    .attr("stroke-dasharray", "4")
    .attr("stroke-width", 1);

  svg.append("text")
    .attr("x", x(new Date("2021-01-01")) + 5)
    .attr("y", 15)
    .attr("font-size", "12px")
    .attr("fill", "gray")
    .text("Winter 2021 peak");

    svg.append("line")
    .attr("x1", x(new Date("2022-01-15")))
    .attr("x2", x(new Date("2022-01-15")))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "gray")
    .attr("stroke-dasharray", "4")
    .attr("stroke-width", 1);

    svg.append("text")
    .attr("x", x(new Date("2022-01-15")) + 5)
    .attr("y", 15)
    .attr("font-size", "12px")
    .attr("fill", "gray")
    .text("Winter 2022 peak");

  svg.append("text")
    .attr("x", x(new Date("2020-07-01")))
    .attr("y", y(700000))
    .attr("font-size", "12px")
    .attr("fill", color("California"))
    .text("CA early surge");

  svg.append("text")
    .attr("x", x(new Date("2020-04-01")))
    .attr("y", y(450000)) 
    .attr("font-size", "12px")
    .attr("fill", color("New York"))
    .text("NY early outbreak");
}


function drawScatterPlot() {
  const latestDate = d3.max(data, d => d.date);

  const latestStats = d3.rollups(
    data.filter(d => d.date.getTime() === latestDate.getTime()),
    v => ({
      state: v[0].state,
      cases: d3.max(v, d => d.cases),
      deaths: d3.max(v, d => d.deaths)
    }),
    d => d.state
  ).map(([state, stats]) => stats);

  const x = d3.scaleLinear()
    .domain([0, d3.max(latestStats, d => d.cases)])
    .range([0, width])
    .nice();

  const y = d3.scaleLinear()
    .domain([0, d3.max(latestStats, d => d.deaths)])
    .range([height, 0])
    .nice();

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format(".2s")));

  const tooltip = d3.select("#tooltip");

  svg.selectAll("circle")
    .data(latestStats)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.cases))
    .attr("cy", d => y(d.deaths))
    .attr("r", 6)
    .attr("fill", "steelblue")
    .attr("opacity", 0.7)
    .on("mouseover", function (event, d) {
      tooltip
        .style("visibility", "visible")
        .html(
          `<strong>${d.state}</strong><br/>Cases: ${d3.format(",")(d.cases)}<br/>Deaths: ${d3.format(",")(d.deaths)}`
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });

  const topStates = latestStats
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 10);

  svg.selectAll("text.label")
    .data(topStates)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.cases))
    .attr("y", d => {
      if (d.state === "California") return y(d.deaths) - 12;
      else if (d.state === "Texas" || d.state === "Florida") return y(d.deaths) + 14;
      else return y(d.deaths) - 6;
    })
    .attr("text-anchor", d => (d.state === "California" ? "middle" : "start"))
    .text(d => stateAbbreviations[d.state] || d.state)
    .attr("font-size", "13px")
    .attr("fill", "black");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text("COVID-19 Cases vs Deaths by State (Latest Date)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 55)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Total Cases");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Total Deaths");
}


function initDropdown() {
  const dropdown = d3.select("#stateDropdown");

  const states = Array.from(new Set(data.map(d => d.state))).sort();

  dropdown.selectAll("option")
    .data(states)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  dropdown.on("change", function () {
    svg.selectAll("*").remove();
    drawSelectedState(this.value);
  });
}

function drawSelectedState(stateName) {
  const filtered = data.filter(d => d.state === stateName);
  filtered.sort((a, b) => d3.ascending(a.date, b.date));

  const x = d3.scaleTime()
    .domain(d3.extent(filtered, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.cases)])
    .range([height, 0])
    .nice();

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %Y"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("path")
    .datum(filtered)
    .attr("fill", "none")
    .attr("stroke", "darkorange")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d.date))
      .y(d => y(d.cases))
    );

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text(`COVID-19 Cases in ${stateName} Over Time`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 55)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Total Cases");
}
