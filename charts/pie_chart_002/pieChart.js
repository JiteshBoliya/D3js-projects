let data = [
    { "title": "Space Exploration", "value": 1, "position": 10, "id": 1 },
    { "title": "Renewable Energy Innovations", "value": 1, "position": 20, "id": 2 },
    { "title": "Empowering Education", "value": 1, "position": 30, "id": 3 },
    { "title": "Healthcare Technologies Advancements", "value": 1, "position": 40, "id": 4 },
    { "title": "Preserving Global Biodiversity", "value": 1, "position": 50, "id": 5 },
    { "title": "Innovative Solutions for Clean Water Access Worldwide Innovative Solutions for Clean Water Access Worldwide", "value": 1, "position": 60, "id": 6 },
    { "title": "AI: Exploring New Frontiers", "value": 1, "position": 70, "id": 7 },
    { "title": "Mental Health Awareness Campaigns Mental Health Awareness Campaigns Mental Health Awareness Campaigns", "value": 1, "position": 80, "id": 8 },
    { "title": "Clean Water Access Initiatives", "value": 1, "position": 90, "id": 9 },
    { "title": "Addressing Climate Change Challenges", "value": 1, "position": 100, "id": 10 }
]

// SVG
const svgContainer = document.getElementById("svgContainer");
const color = d3.scaleOrdinal(d3.schemeDark2);
const svgMargin = 50;
let width = svgContainer.clientWidth - svgMargin * 2;
let height = svgContainer.clientHeight - svgMargin * 2;

// Lable
let fontSize = Math.min(width, height) * 0.02;
const maxlineSize = 20;

// Pie
let outerRadius = Math.min(height * 0.5, width * 0.3);
let outerPieRadius = outerRadius * 0.4;
let innerPieRadius = outerRadius * 0.3;

// Center Image
let centerImageSize = innerPieRadius - (outerRadius * 0.01);

// Segements
const selectedSegementIncressUpto = (outerPieRadius - innerPieRadius) * 0.5;
const maxSegementListSize = 15;
const selectedSegmentListSize = 1;
let selectedSegementList = [];
let currentSagment = null;


// Polyline
let columnList = [1, 0.8];

// Transition
const transitionSpeed = 100;
const transitionType = d3.easeLinear;

// Config
const getRandomTextForLable = false;

data = data.map((dd) => {
    return { ...dd, selected: false }
});

// Arc
const arc = d3
    .arc()
    .innerRadius(innerPieRadius)
    .outerRadius((d, i) => d.data.selected ? (outerPieRadius + selectedSegementIncressUpto) : outerPieRadius); //incress the arc/segement size

const arcLabel = d3
    .arc()
    .innerRadius(outerRadius * 0.25)
    .outerRadius(outerRadius);

const arcLine = d3
    .arc()
    .innerRadius(Math.max(innerPieRadius, outerPieRadius))
    .outerRadius(outerPieRadius);

const pie = d3
    .pie()
    .padAngle(0.01)
    .sort(null)
    .value((d) => d.value);

const svg = d3
    .select('#svgContainer')
    .append('svg')
    .attr("id", "pieSvg")
    .style("width", width + svgMargin)
    .style("height", height + svgMargin)

// Get the hight,width,top,bottom,left and right of svg
let pieChartRect = d3.select("#pieChartContainer").node().getBoundingClientRect();

const g = svg
    .append("g")
    .attr("id", "mainG")
    .attr("transform", `translate(${(width + svgMargin) / 2}, ${(height + svgMargin) / 2})`);

const imageG = g
    .append("g")
    .attr("id", "imageG");

const pathG = g
    .append("g")
    .attr("id", "pathG");

const ployArcG = g
    .append("g")
    .attr("id", "polyArcG");

const ployLableG = g
    .append("g")
    .attr("id", "ployLableG");

const hiddenPathG = g
    .append("g")
    .attr("id", "hiddenPathG");

const tooltip = d3.selectAll(".tooltip");
loadCenterImage();
function loadCenterImage() {
    imageG.selectAll("defs").remove();
    imageG.selectAll("circle").remove();
    async function createRandomImage() {
        const imageUrl = await getRandomImageUrl();
        imageG
            .append("defs")
            .append("pattern")
            .attr("id", "image")
            .attr("width", 1)
            .attr("height", 1)
            .append("image")
            .attr("xlink:href", imageUrl)
            .attr("width", innerPieRadius * 3)
            .attr("height", innerPieRadius * 3)
            .attr("x", -innerPieRadius / 2)
            .attr("y", -innerPieRadius / 2);
    }
    createRandomImage();

    imageG.append("circle")
        .style('fill', 'url(#image)')
        .attr("r", centerImageSize);
}

const addButton = document.getElementById("addSegement");
const downloadButton = document.getElementById("downloadImage");

addButton.addEventListener("click", function () {
    data.sort((a, b) => a.position - b.position);
    let titleText = "title";
    if (getRandomTextForLable) {
        // Code for random text(qouts) genaretor
        svg.style("fill-opacity", 0.5);
        getRandomLine().then(quote => {
            titleText = quote
            createSegementData();
            svg.style("fill-opacity", 1);
        });
    } else {
        createSegementData();
    }
    function createSegementData() {
        const newData = { "title": titleText, "value": 1, "position": (data.length + 1) * 10, "id": data.length + 1, "selected": false };
        if (selectedSegementList.length) {
            const index = data.findIndex(item => item.id === selectedSegementList[0]);
            if (index !== -1) {
                data.splice(index, 0, newData);
            } else {
                console.log("ID not found in the array.");
            }
        } else {
            data.push(newData);
        }
        data = data.map((dd, i) => {
            dd.position = (i + 1) * 10;
            return dd;
        });
        data.sort((a, b) => a.position - b.position);
        loadData();
    }
})

downloadButton.addEventListener("click", exportSvg);

loadData();
function loadData() {
    hiddenPathG.selectAll('path').remove();
    ployArcG.selectAll("polyline").remove();

    pathG.selectAll('path')
        .data(pie(data), (d) => d.data.id)
        .join((enter) =>
            enter
                .append("path")
                .attr("d", arc)
                .attr("id", d => `p${d.data.id}`)
                .style("fill", (d) => color(d.data.id)),
            (update) => update
                .transition()
                .duration(transitionSpeed)
                .ease(transitionType)
                .attr("d", arc)
                .style("fill", (d) => color(d.data.id))
        );

    // Data for hidden arc
    const hiddenArcData = [];
    data.forEach((d) => {
        hiddenArcData.push({ "part": 1, ...d });
        hiddenArcData.push({ "part": 2, ...d });
    });

    hiddenPathG
        .selectAll('path')
        .data(pie(hiddenArcData), (d) => d.data.id)
        .join("path")
        .attr("d", arc)
        .attr("id", d => `ps${d.data.part}`)
        .style("fill", "transparent")
        .on("click", function (event, d) {
            let newData = [];
            if (d.data.selected) {
                selectedSegementList = selectedSegementList.filter((s) => s != d.data.id);
                newData = data.map((dd) => {
                    if (d.data.id === dd.id)
                        dd.selected = false;
                    return dd;
                })
            } else {
                if (selectedSegmentListSize > 1) {
                    if (selectedSegementList.length >= selectedSegmentListSize)
                        selectedSegementList = selectedSegementList.slice(1);

                    selectedSegementList.push(d.data.id);
                    newData = data.map((dd) => {
                        if (selectedSegementList.find((s) => s === dd.id)) {
                            dd.selected = true;
                        } else {
                            dd.selected = false;
                        }
                        return dd;
                    })
                } else {
                    selectedSegementList = [d.data.id];
                    newData = data.map((dd) => {
                        if (d.data.id === dd.id) {
                            dd.selected = true;
                        } else {
                            dd.selected = false;
                        }
                        return dd;
                    })
                }
            }
            data = newData;
            loadData();
        })
        .on("mouseover", function (event, d) {
            currentSagment = d;
        })
        .on("mouseout", function () {
            currentSagment = null;
        })
        .call(d3.drag()
            .on("start", function () { })
            .on("drag", function (event, d) {
                if (currentSagment != null) {
                    const dragableData = data.find((dd) => dd.id === d.data.id);
                    if (currentSagment.data.id != dragableData.id) {
                        data = data.map((dd) => {
                            if (dd.id === dragableData.id) {
                                if (currentSagment.data.part === 1) {
                                    dd.position = currentSagment.data.position - 5;
                                } else {
                                    dd.position = currentSagment.data.position + 5;
                                }
                            }
                            return dd;
                        })
                        data.sort((a, b) => a.position - b.position);
                        data = data.map((dd, i) => {
                            dd.position = (i + 1) * 10;
                            return dd;
                        });
                        loadData();
                    }
                }
            })
            .on("end", function () {
                currentSagment = null;
            })
        )

    ployArcG
        .selectAll("path")
        .data(pie(data), (d) => d.data.id)
        .join(
            enter =>
                enter
                    .append("polyline")
                    .style("fill", "none")
                    .style("stroke", (d) => color(d.data.id))
                    .style("stroke-width", "1px")
                    .call(selection => selection.attr("points", d => linePosition(d))),
            update =>
                update.call(selection =>
                    selection
                        .transition()
                        .attr("points", d => linePosition(d))
                )
        );

    ployLableG
        .selectAll("text")
        .data(pie(data), (d) => d.data.id)
        .join(
            enter =>
                enter.append("text").call(selection =>
                    selection
                        .attr("dy", ".35em")
                        .attr("transform", d => `translate(${labelPosition(d)})`)
                        .style("text-anchor", d => labelAnchor(d))
                        .style("cursor", " pointer")
                        .call(text => text.append("tspan").text(d => d.data.title))
                ),
            update =>
                update.call(selection =>
                    selection
                        .transition()
                        .style("text-anchor", d => labelAnchor(d))
                        .attr("transform", d => `translate(${labelPosition(d)})`)
                )
        ).on("mouseover", function (event, d) {
            d3.select(this).style("opacity", 0);
            tooltip
                .style("display", "block")
                .style("font-size", `${fontSize}px`)
                .html(
                    ` <div class="tooltipBody" style="background-color: ${color(d.data.id)}; ">
                        <span>${d.data.title}</span>
                    </div> 
                `
                )
                .style("left", () => {
                    if ((midAngle(d) < Math.PI)) {
                        return ((pieChartRect.right) / 2) + labelPosition(d)[0] + "px";
                    }
                })
                .style("right", () => {
                    if ((midAngle(d) > Math.PI)) {
                        return (pieChartRect.right / 2) - labelPosition(d)[0] + "px";
                    }
                })
                .style("top", (pieChartRect.bottom / 2) + labelPosition(d)[1] + 10 + "px")
        })
        .on("mouseout", function (event, d) {
            tooltip.style("display", "none");
            d3.select(this).style("opacity", 1);
        });

    ployLableG.selectAll("text")
        .each(function (d, i) { wrapTextNChar(d3.select(this), maxlineSize) });
}

function linePosition(d) {
    let column = isMaxSegments(data, d);
    let pos = arcLabel.centroid(d);
    pos[0] = (outerRadius * 0.8) * (midAngle(d) < Math.PI ? column : -column);
    return [arcLine.centroid(d), arcLabel.centroid(d), pos];
}

function labelPosition(d) {
    let column = isMaxSegments(data, d);
    let pos = arcLabel.centroid(d);
    pos[0] = (outerRadius * 0.81) * (midAngle(d) < Math.PI ? column : -column);
    return pos;
}

function isMaxSegments(data, d) {
    if (data.length > maxSegementListSize) {
        return d.index % 2 === 0 ? columnList[0] : columnList[1];
    } else {
        return columnList[0];
    }
}

function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2
}

function labelAnchor(d) {
    return midAngle(d) < Math.PI ? "start" : "end";
}

function wrapTextArray(text, maxWidth) {
    const words = text.split(/\s+/).reverse();
    let word;
    let lines = [];
    let line = [];

    while (word = words.pop()) {
        const remainingSpace = maxWidth - line.join(" ").length;
        line.push(word);
        if (line.join(" ").length > maxWidth) {
            if (remainingSpace < (word.length / 2)) {
                line.pop()
                lines.push(line.join(" ") + " ");
                line = [word];
            }
        }
    }
    lines.push(line.join(" "));
    return lines;
}

function wrapTextNChar(textElement, maxWidth) {
    let textArray = wrapTextArray(textElement.text(), maxWidth);

    // If data size more the maxSegmentSize
    if (data.length > maxSegementListSize) {
        if (textArray.length > 1) {
            textArray = textArray.slice(0, 1);
            textArray[0] = textArray[0].trimEnd().concat('...');
        }
    } else {
        if (textArray.length > 2) {
            textArray = textArray.slice(0, 2);
            textArray[textArray.length - 1] = textArray[textArray.length - 1].trimEnd().concat('...');
        }
    }

    textElement
        .text(null)
        .selectAll("tspan")
        .data(textArray)
        .enter()
        .append("tspan")
        .attr("x", "0em")
        .attr("y", "0.3em")
        .style("font-size", fontSize)
        .attr("dy", (d, i) => `${i}em`)
        .text(d => d);
}

function exportSvg() {
    const svgElement = document.getElementById('pieSvg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const canvas = document.createElement('canvas');
    canvas.width = svgContainer.clientWidth + svgMargin;
    canvas.height = svgContainer.clientHeight + svgMargin;
    const context = canvas.getContext('2d');
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = function () {
        context.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpg');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'pie_image.jpg';
        a.click();
    };

    console.log({ svgString });

    img.src = 'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgString)));
}

async function getRandomImageUrl() {
    const response = await fetch('./images/image-cropped-8x10.jpg'); //https://source.unsplash.com/random/400x300
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

async function getRandomLine(maxLength = 50) {
    const apiUrl = "http://api.quotable.io/random"; // A random quotes API

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Check if the quote is within the desired length
        if (data.content.length <= maxLength) {
            return data.content;
        } else {
            // If the quote is too long, fetch another one
            return getRandomLine(maxLength);
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
        return "An error occurred while fetching a quote.";
    }
}

window.addEventListener("resize", function () {
    width = svgContainer.clientWidth - svgMargin * 2;
    height = svgContainer.clientHeight - svgMargin * 2;

    fontSize = Math.min(width, height) * 0.02;

    // Pie
    outerRadius = Math.min(height * 0.5, width * 0.3);
    outerPieRadius = outerRadius * 0.4;
    innerPieRadius = outerRadius * 0.3;
    // columnList = [outerRadius * 0.0025, outerRadius * 0.002];

    // Center Image
    centerImageSize = innerPieRadius - (outerRadius * 0.01);

    arc
        .innerRadius(innerPieRadius)
        .outerRadius((d, i) => d.data.selected ? (outerPieRadius + selectedSegementIncressUpto) : outerPieRadius);

    arcLabel
        .innerRadius(outerRadius * 0.25)
        .outerRadius(outerRadius);

    arcLine
        .innerRadius(Math.max(innerPieRadius, outerPieRadius))
        .outerRadius(outerPieRadius);

    svg
        .style("width", width + svgMargin)
        .style("height", height + svgMargin)

    svgRect = svg.node().getBoundingClientRect();

    g.attr("transform", `translate(${(width + svgMargin) / 2}, ${(height + svgMargin) / 2})`);

    loadCenterImage();

    pieChartRect = d3.select("#pieChartContainer").node().getBoundingClientRect();

    loadData();
})