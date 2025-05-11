let partyList = [
    { "name": 'BJP', "partyColor": "#FF671F" },
    { "name": 'AAAP', "partyColor": "#009ADA" },
    { "name": 'INC', "partyColor": "#000000" },
    { "name": 'BSP', "partyColor": "#22409A" },
    { "name": 'BLD', "partyColor": "#11701f" },
    { "name": 'IND', "partyColor": "#2f4f4f" },
    { "name": 'CPM', "partyColor": "#FF0000" },
    { "name": 'CPI', "partyColor": "#FF0000" },
    { "name": 'AITC', "partyColor": "#FF9900" },
    { "name": 'SP', "partyColor": "#FE0000" },
    { "name": 'ADMK', "partyColor": "#000000" },
    { "name": 'TDP', "partyColor": "#FFFF00" },
];
const svgContainer = document.getElementById("svgContainer");
const dropdown = document.getElementById('yearDropdown');
const graphDropdown = document.getElementById('graphDropdown');
const loadingScreen = document.getElementById("loadingScreen");

let width = svgContainer.clientWidth;
let height = svgContainer.clientHeight;

let x = d3.scaleLinear().rangeRound([0, width]);
let y = d3.scaleLinear().rangeRound([0, height]);
const color = d3.scaleOrdinal(d3.schemeDark2);
const format = d3.format(",d");
const tooltip = d3.select("#tooltip").attr("class", "tooltip");
const treemapData = {
    "name": "Indian national level election",
    "children": []
};
const stackLevelText = ["Party", "State", "District", "Candidate"];
const maxDepth = 5;
let selectedYear = null;
let count = 0;
let current = null;
let parentList = [];

const svgDiv = d3
    .select("#svgDiv")
    .append("svg");

d3.csv('./data/indian-national-level-election.csv').then((data) => {
    let yearData = [...new Set(data.map(obj => obj.year))];
    populateYearDropdown(yearData);
    loadData();

    dropdown.addEventListener(("change"), () => {
        selectedYear = dropdown.value;
        loadData()
    });
    graphDropdown.addEventListener("change", () => {
        loadGraph();
    });

    window.addEventListener("resize", function () {
        width = svgContainer.clientWidth;
        height = svgContainer.clientHeight;
        x.rangeRound([0, width]);
        y.rangeRound([0, height]);
        loadGraph();
    })

    function loadData() {
        partyList = partyList.map((p) => {
            const partyData = data.find((d) => d.partyabbre === p.name);
            return {
                ...p,
                "fullName": partyData.partyname
            }
        })

        // Modify the data
        const groupData = groupBy(data.filter((d) => d.year === selectedYear), "partyabbre");
        Object.values(groupData).forEach((d) => {

            d.children = Object.values(groupBy(d.children.filter((c) => c.year === selectedYear), "st_name"));
            Object.values(d.children).forEach((dd) => {

                dd.children = Object.values(groupBy(dd.children.filter((c) => c.year === selectedYear), "pc_name"));
                Object.values(dd.children).forEach((ddd) => {

                    ddd.children = Object.values(groupBy(ddd.children.filter((c) => c.year === selectedYear), "cand_name"));
                    Object.values(ddd.children).forEach((dddd) => {
                        dddd.children = dddd.children.map((c) => {
                            return {
                                ...c,
                                "name": c.cand_name,
                                "value": parseInt(c.totvotpoll)
                            }
                        });
                    });
                });
            })
        });

        const updatedGroupData = Object.values(groupData).map((d) => {
            const partyData = partyList.find((p) => p.name === d.name);
            if (partyData != undefined) {
                return {
                    ...d,
                    "image": `./images/${partyData.name}.png`,
                    "color": partyData.partyColor
                }
            } else {
                return d;
            }
        })

        treemapData.children = Object.values(updatedGroupData);
        loadGraph();
    }

    function loadGraph() {
        loadingScreen.style.display = "flex";
        svgDiv
            .selectAll("g")
            .remove();

        svgDiv
            .attr("height", 0)
            .attr("width", 0);

        loadingScreen.style.display = "none";
        if (graphDropdown.value === "treeMapDiv") {
            loadTreeMap(treemapData);
        }
        else if (graphDropdown.value === "packCircleDiv") {
            loadpackCircle(treemapData);
        }
        else if (graphDropdown.value === "sunburstDiv") {
            loadSunburst(treemapData);
        }
    }

    function groupBy(data, key) {
        return data.reduce((result, item) => {
            if (!result[item[key]]) {
                result[item[key]] = { name: item[key], children: [] };
            }
            result[item[key]].children.push(item);
            return result;
        }, {});
    }

    function populateYearDropdown(yearData) {
        selectedYear = yearData[0];
        dropdown.innerHTML = '';
        yearData.forEach(function (optionData) {
            const option = document.createElement('option');
            option.href = '#';
            option.textContent = optionData;
            dropdown.appendChild(option);
        });
    }
});

// ========= Load Graphs =============
function loadTreeMap(treemapData) {
    const hierarchy = d3
        .hierarchy(treemapData)
        .sum(d => d.value)
        .sort((a, b) => a.value - b.value);

    const root = d3
        .treemap()
        .tile(tile)(hierarchy);

    svgDiv
        .attr("viewBox", [0.5, 0.5, width, height])
        .attr("height", height)
        .attr("width", width);

    let group = svgDiv
        .append("g")
        .attr("id", "tiles")
        .call(render, root);

    if (current != null) {
        zoomout(root.children[0]);
    }

    function tile(node, x0, y0, x1, y1) {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
            child.x0 = x0 + child.x0 / width * (x1 - x0);
            child.x1 = x0 + child.x1 / width * (x1 - x0);
            child.y0 = y0 + child.y0 / height * (y1 - y0);
            child.y1 = y0 + child.y1 / height * (y1 - y0);
        }
    }
    parentList = [root];
    function render(group, root) {
        const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g")
            .on("mousemove", function (event, d) {

                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;
                let left = event.pageX + 5;
                let top = event.pageY - 28;

                // Adjust if tooltip goes beyond the right edge
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - 5;
                }

                // Adjust if tooltip goes beyond the bottom edge
                if (top + tooltipHeight > window.innerHeight) {
                    top = event.pageY - tooltipHeight - 5;
                }

                // Adjust if tooltip goes beyond the left edge
                if (left < 0) {
                    left = 5;
                }

                // Adjust if tooltip goes beyond the top edge
                if (top < 0) {
                    top = 5;
                }

                tooltip
                    .style("display", "block")
                    .style("left", (left) + "px")
                    .style("top", (top) + "px");

                if (!d.data?.children || d.data.children[0].cand_name) {
                    const data = !d.data?.children ? d.data : d.data.children[0];
                    let result = d;
                    while (d.depth > 1) d = d.parent;
                    const partyData = partyList.find((p) => p.name === d.data.name);
                    const colors = partyData ? partyData.partyColor : color(d.data.name);

                    tooltip.style("min-width", "300px");
                    tooltip.html(
                        ` <div class="tooltipBody" style="border: 3px solid ${colors}">
                            <div class="tooltip-row"><b>Candidate name: </b><span> ${data.name}</span></div>
                            <div class="tooltip-row"><b>Party name: </b><span> ${data.partyname}</span></div>
                            <div class="tooltip-row"><b>Parliamentary constituency name: </b> <span>${data.pc_name}</span></div>
                            <div class="tooltip-row"><b>Parliamentary constituency type: </b> <span>${data.pc_type}</span></div>
                            <div class="tooltip-row"><b>Electors: </b> <span>${format(data.electors)}</span></div>
                            <hr/>
                            <div class="tooltip-row"><b>Total vote poll : </b><span>${format(result.value)}</span></div>
                            <div class="tooltip-row"><b>Vote percentage(%): </b><span>${((result.value / data.electors) * 100).toFixed(2)}</span></div>
                        </div> `
                    );
                } else {
                    tooltip.style("min-width", "200px");
                    let result2;
                    let result = d;
                    if (d.depth === 1) {
                        result2 = partyList.find((p) => p.name === d.data.name);
                    }
                    while (d.depth > 1) d = d.parent;
                    const partyData = partyList.find((p) => p.name === d.data.name);
                    const colors = partyData ? partyData.partyColor : color(d.data.name);

                    tooltip.html(
                        ` <div class="tooltipBody" style="border: 3px solid ${colors}">
                            <span><b>${result.data.name}${result2 ? `(${result2.fullName})` : ''}</b></span><hr/>
                            <span><b>Total vote poll : </b>${format(result.value)}</span>
                        </div> `
                    );
                }
            })
            .on("mouseout", function (event, d) {
                tooltip.style("display", "none");
            });

        node.filter(d => d === root ? d.parent : d.children)
            .attr("cursor", "pointer")
            .on("click", (event, d) => d === root ? null : zoomin(d));

        node.append("rect")
            .attr("id", d => (d.leafUid = uid("leaf")).id)
            .attr("fill", (d) => {
                let current = d;
                if (d === root) return "transparent";
                while (d.depth > 1) d = d.parent;
                const partyData = partyList.find((p) => p.name === d.data.name);

                if (partyData) {
                    return current.depth === 1 ? partyData.partyColor : getRandomColorVariant(partyData.partyColor);
                } else {
                    return current.depth === 1 ? color(current.data.name) : getRandomColorVariant(color(d.data.name));
                }
            })
            .attr("stroke", "white")

        node.append("clipPath")
            .attr("id", d => (d.clipUid = uid("clip")).id)
            .append("use")
            .attr("xlink:href", d => d.leafUid.href);

        node.append("text")
            .attr("clip-path", d => d.clipUid)
            .attr("font-weight", "bold")
            .attr("x", (d) => {
                return ((d === current || d === root) && d.data.image) ? '1em' : '0.5em';
            })
            .attr("y", (d) => {
                return (d === current || d === root) ? '2em' : '1.2em';
            })
            .style("font-size", 25)
            .style("fill", (d) => {
                let current = d;
                while (d.depth > 1) d = d.parent;
                const partyData = partyList.find((p) => p.name === d.data.name);
                if (partyData) {
                    return getCorrectTextColor(partyData.partyColor);
                } else {
                    return getCorrectTextColor(color(current.data.name));
                }
            })
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .text(d => {
                if (d === current || d === root) {
                    return "";
                    // if (!parentList.length) return d.data.name;
                    // return parentList.map((p) => p.data.name).join(">>")
                }
                return d.data.name
            });

        node.append("text")
            .attr("clip-path", d => d.clipUid)
            .attr("x", '0.7em')
            .attr("y", (d, i, nodes) => `2.8em`)
            .style("font-size", 18)
            .style("fill", (d) => {
                let current = d;
                while (d.depth > 1) d = d.parent;
                const partyData = partyList.find((p) => p.name === d.data.name);
                if (partyData) {
                    return getCorrectTextColor(partyData.partyColor);
                } else {
                    return getCorrectTextColor(color(current.data.name));
                }
            })
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .text(d => { if (d !== current && d !== root) return format(d.value) });

        node.append("foreignObject")
            .attr("clip-path", d => d.clipUid)
            .attr("x", '0.8em')
            .attr("y", (d) => {
                return (d === root) ? '1em' : '3.8em';
            })
            .attr("width", (d) => {
                return (d === root) ? 0 : 60;
            })
            .attr("height", (d) => {
                return (d === root) ? 0 : 60;
            })
            .html(d => {
                if (d.data.image && d.depth === 1)
                    return `<img src="${d.data.image}" alt="${d.data.name}" width="100%" height="100%">`;
            });

        group.call(position, root);
    }

    // ========= Zoom & position ===================
    function position(group, root) {
        group.selectAll("g")
            .attr("transform", d => d === root ? `translate(0,0)` : `translate(${x(d.x0)},${y(d.y0)})`)
            .select("rect")
            .attr("width", d => d === root ? 0 : x(d.x1) - x(d.x0))
            .attr("height", d => d === root ? 0 : y(d.y1) - y(d.y0));

        svgDiv.selectAll("#parentG").remove();
        svgDiv.attr("viewBox", [0.5, -(40 * root.depth), width, height - root.depth]);

        const parentSvg = svgDiv
            .append("g")
            .attr("id", "parentG")
            .attr("transform", `translate(0,${-(50 * root.depth) - (maxDepth - root.depth * 10 + 35)})`);

        while (root.parent != null) {
            const parentG = parentSvg
                .append("g")
                .attr("id", root.data.name)
                .on("click", (event, d) => {
                    const data = parentList.find((p) => p.data.name === event.target.parentNode.id);
                    zoomout(data);
                })
                .attr("transform", `translate(0,${root.depth * 40})`);

            parentG
                .append("rect")
                .attr("transform", `translate(0,0)`)
                .style("fill", () => {
                    let d = root;
                    let current = d;
                    while (d.depth > 1) d = d.parent;
                    const partyData = partyList.find((p) => p.name === d.data.name);
                    if (partyData) {
                        return current.depth === 1 ? partyData.partyColor : getRandomColorVariant(partyData.partyColor);
                    } else {
                        return current.depth === 1 ? color(current.data.name) : getRandomColorVariant(color(current.data.name));
                    }
                })
                .style("stroke", "white")
                .attr("width", width)
                .attr("height", 40);

            parentG
                .append("text")
                .attr("transform", `translate(${(root.depth === 1 && root.data.image) ? "40" : "10"},27)`)
                .style("font-size", "20px")
                .style("fill", () => {
                    let d = root;
                    while (d.depth > 1) d = d.parent;
                    const partyData = partyList.find((p) => p.name === d.data.name);
                    if (partyData) {
                        return getCorrectTextColor(partyData.partyColor);
                    } else {
                        return getCorrectTextColor(color(d.data.name));
                    }
                })
                .text(`${stackLevelText[root.depth - 1]} : ${root.data.name}`);

            parentG
                .append("foreignObject")
                .attr("width", 30)
                .attr("height", 30)
                .style("display", () => root.depth === 1 ? "inline" : "none")
                .attr("transform", `translate(5,5)`)
                .html(() => {
                    if (root.depth === 1 && root.data.image)
                        return `<img src="${root.data.image}" alt="${root.data.name}" width="100%" height="100%" />`;
                });
            root = root.parent;
        }
    }

    function zoomin(d) {
        current = d;
        parentList.push(d);
        const group0 = group.attr("pointer-events", "none");
        const group1 = (group = svgDiv.append("g").call(render, d));

        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);

        svgDiv
            .transition()
            .duration(750)
            .call(t =>
                group0
                    .transition(t)
                    .remove()
                    .call(position, d.parent)
            )
            .call(t =>
                group1
                    .transition(t)
                    .attrTween("opacity", () => d3.interpolate(0, 1))
                    .call(position, d)
            );
    }

    function zoomout(d) {
        parentList.pop();
        current = null;
        const group0 = group.attr("pointer-events", "none");
        const group1 = (group = svgDiv.insert("g", "*").call(render, d.parent));

        x.domain([d.parent.x0, d.parent.x1]);
        y.domain([d.parent.y0, d.parent.y1]);

        svgDiv
            .transition()
            .duration(750)
            .call(t =>
                group0
                    .transition(t)
                    .remove()
                    .attrTween("opacity", () => d3.interpolate(1, 0))
                    .call(position, d)
            )
            .call(t => group1.transition(t).call(position, d.parent));
    }

    // ====== UID ===========
    function uid(name) {
        return new Id("O-" + (name == null ? "" : name + "-") + ++count);
    }

    function Id(id) {
        this.id = id;
        this.href = new URL(`#${id} `, location) + "";
    }

    Id.prototype.toString = function () {
        return "url(" + this.href + ")";
    };
}

function loadpackCircle(treemapData) {
    svgDiv
        .attr("viewBox", [-(width / 2), -(width / 2), width, width])
        .attr("height", height)
        .attr("width", width);

    const pack = (data) => d3.pack()
        .size([width, height])
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));

    const root = pack(treemapData);
    let filterData = root.children;
    let node, label, votePoll, votePercentage;
    let selectedNode = root;
    randerGraph(filterData);

    function nodeMouseMove(event, d) {

        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;
        let left = event.pageX + 5;
        let top = event.pageY - 28;

        // Adjust if tooltip goes beyond the right edge
        if (left + tooltipWidth > window.innerWidth) {
            left = event.pageX - tooltipWidth - 5;
        }

        // Adjust if tooltip goes beyond the bottom edge
        if (top + tooltipHeight > window.innerHeight) {
            top = event.pageY - tooltipHeight - 5;
        }

        // Adjust if tooltip goes beyond the left edge
        if (left < 0) {
            left = 5;
        }

        // Adjust if tooltip goes beyond the top edge
        if (top < 0) {
            top = 5;
        }

        tooltip
            .style("display", "block")
            .style("left", left + "px")
            .style("top", top + "px");

        if (!d.data?.children || d.data.children[0].cand_name) {
            const data = !d.data?.children ? d.data : d.data.children[0];
            let result = d;
            while (d.depth > 1) d = d.parent;
            const partyData = partyList.find((p) => p.name === d.data.name);
            const colors = partyData ? partyData.partyColor : color(d.data.name);

            tooltip.style("min-width", "300px");
            tooltip.html(
                ` <div class="tooltipBody" style="border: 3px solid ${colors}">
                        <div class="tooltip-row"><b>Candidate name: </b><span> ${data.name}</span></div>
                        <div class="tooltip-row"><b>Party name: </b><span> ${data.partyname}</span></div>
                        <div class="tooltip-row"><b>Parliamentary constituency name: </b> <span>${data.pc_name}</span></div>
                        <div class="tooltip-row"><b>Parliamentary constituency type: </b> <span>${data.pc_type}</span></div>
                        <div class="tooltip-row"><b>Electors: </b> <span>${format(data.electors)}</span></div>
                        <hr/>
                        <div class="tooltip-row"><b>Total vote poll : </b><span>${format(result.value)}</span></div>
                        <div class="tooltip-row"><b>Vote percentage(%): </b><span>${((result.value / data.electors) * 100).toFixed(2)}</span></div>
                    </div> `
            );
        } else {
            tooltip.style("min-width", "200px");
            let result2;
            let result = d;
            if (d.depth === 1) {
                result2 = partyList.find((p) => p.name === d.data.name);
            }
            while (d.depth > 1) d = d.parent;
            const partyData = partyList.find((p) => p.name === d.data.name);
            const colors = partyData ? partyData.partyColor : color(d.data.name);

            tooltip.html(
                ` <div class="tooltipBody" style="border: 3px solid ${colors}">
                        <span><b>${result.data.name}${result2 ? `(${result2.fullName})` : ''}</b></span><hr/>
                        <span><b>Total vote poll : </b>${format(result.value)}</span>
                    </div> `
            );
        }
    }

    function nodeColor(d) {
        let current = d;
        while (d.depth > 1) d = d.parent;
        const partyData = partyList.find((p) => p.name === d.data.name);
        if (partyData) {
            // return current.depth === 1 ? partyData.partyColor : getRandomColorVariant(partyData.partyColor);
            return partyData.partyColor;
        } else {
            // return current.depth === 1 ? color(current.data.name) : getRandomColorVariant(color(current.data.name));
            return color(current.data.name);
        }
    }

    function lableColor(d) {
        let current = d;
        while (d.depth > 1) d = d.parent;
        const partyData = partyList.find((p) => p.name === d.data.name);
        if (partyData) {
            return getCorrectTextColor(partyData.partyColor);
        } else {
            return getCorrectTextColor(color(current.data.name));
        }
    }

    function randerGraph(filterData) {
        svgDiv.selectAll("g").remove();

        node = svgDiv
            .append("g")
            .selectAll("circle")
            .data(filterData)
            .join("circle")
            .attr("fill", nodeColor)
            .style("fill-opacity", 0.5)
            .style("stroke", "lightGray")
            .style("stroke-width", 1)
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()))
            .on("mousemove", nodeMouseMove)
            .on("mouseout", () => tooltip.style("display", "none"));

        label = svgDiv.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(filterData)
            .join("text")
            .style("font-family", "sans-serif")
            .style("font-weight", "bold")
            .style("fill-opacity", d => d.parent === d.parent ? 1 : 0)
            .style("display", d => d.parent === selectedNode ? "inline" : "none")
            .style("fill", lableColor)
            .text(d => truncateText(d.data.name, 20));

        votePoll = svgDiv.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(filterData)
            .join("text")
            .style("font-family", "sans-serif")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === selectedNode ? "inline" : "none")
            .style("fill", lableColor)
            .text(d => format(d.value));

        votePercentage = svgDiv.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(filterData)
            .join("text")
            .style("font-family", "sans-serif")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => !d.data?.children || d.data.children[0].cand_name ? "inline" : "none")
            .style("fill", lableColor)
            .text(d => {
                if (!d.data?.children || d.data.children[0].cand_name) {
                    const data = !d.data?.children ? d.data : d.data.children[0];
                    return `${((d.value / data.electors) * 100).toFixed(2)}% `
                }
            });
    }

    // Create the zoom behavior and zoom immediately in to the initial focus node.
    svgDiv.on("click", (event) => {
        if (graphDropdown.value === "packCircleDiv") zoom(event, root);
    });
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];
        view = v;

        label
            .attr("transform", d => `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`)
            .style("font-size", d => d.r * k / 7);
        votePoll
            .attr("transform", d => `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k + (d.r * k / 8)})`)
            .style("font-size", d => d.r * k / 8);
        votePercentage
            .attr("transform", d => `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k + (d.r * k / 4)})`)
            .style("font-size", d => d.r * k / 10);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
        const focus0 = focus;
        focus = d;
        selectedNode = d;

        const transition = svgDiv.transition()
            .duration(event.altKey ? 7500 : 750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });

        // Added new children
        filterData.push(...d.children);

        // Remove childerns if not in current depth
        filterData = filterData.filter((f) => f.depth <= d.depth + 1);

        // Remove duplicate childrens
        const seen = new Set();
        filterData = filterData.filter(obj => {
            const key = JSON.stringify(obj.data);
            return seen.has(key) ? false : seen.add(key);
        });

        randerGraph(filterData);

        label
            .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });

        votePoll
            .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });

        votePercentage
            .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; })
    }
}

function loadSunburst(treemapData) {
    let lableFontSize = width * 0.01;
    svgDiv
        .attr("viewBox", [-width / 2, -width / 2, width, width])
        .attr("height", height)
        .attr("width", width);
    const radius = width / 6;

    const hierarchy = d3.hierarchy(treemapData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    const root = d3.partition()
        .size([2 * Math.PI, hierarchy.height + 1])
        (hierarchy);
    root.each(d => d.current = d);

    // Create the arc generator.
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const format = d3.format(",d");

    svgDiv.selectAll("g").remove();

    const sunburstG = svgDiv
        .append("g")
        .attr("id", "sunburstG");

    // Append the arcs.
    const path = sunburstG.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .style("fill", (d) => {
            let current = d;
            while (d.depth > 1) d = d.parent;
            const partyData = partyList.find((p) => p.name === d.data.name);
            if (partyData) {
                return current.depth === 1 ? partyData.partyColor : getRandomColorVariant(partyData.partyColor);
            } else {
                return current.depth === 1 ? color(current.data.name) : getRandomColorVariant(color(current.data.name));
            }
        })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
        .attr("d", d => arc(d.current));

    // Make them clickable if they have children.
    path.filter(d => d.children)
        .style("cursor", "pointer")
        .on("click", clicked);

    const label = sunburstG.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .style("fill", (d) => {
            let current = d;
            while (d.depth > 1) d = d.parent;
            const partyData = partyList.find((p) => p.name === d.data.name);
            if (partyData) {
                return getCorrectTextColor(partyData.partyColor);
            } else {
                return getCorrectTextColor(color(current.data.name));
            }
        })
        .style("font-size", lableFontSize)
        .style("font-weight", "bold")
        .attr("transform", d => labelTransform(d.current))
        .text(d => truncateText(d.data.name, 20));


    path
        .on("mousemove", function (event, d) {
            d3.select(this)
                .attr("fill-opacity", 1);
            // label

            tooltip
                .style("display", "block")
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY + "px");

            if (!d.data?.children || d.data.children[0].cand_name) {
                const data = !d.data?.children ? d.data : d.data.children[0];
                let result = d;
                while (d.depth > 1) d = d.parent;
                const partyData = partyList.find((p) => p.name === d.data.name);
                const colors = partyData ? partyData.partyColor : color(d.data.name);

                tooltip.style("min-width", "300px");
                tooltip.html(
                    ` <div class="tooltipBody" style="border: 3px solid ${colors}">
                        <div class="tooltip-row"><b>Candidate name: </b><span> ${data.name}</span></div>
                        <div class="tooltip-row"><b>Party name: </b><span> ${data.partyname}</span></div>
                        <div class="tooltip-row"><b>Parliamentary constituency name: </b> <span>${data.pc_name}</span></div>
                        <div class="tooltip-row"><b>Parliamentary constituency type: </b> <span>${data.pc_type}</span></div>
                        <div class="tooltip-row"><b>Electors: </b> <span>${format(data.electors)}</span></div>
                        <hr/>
                        <div class="tooltip-row"><b>Total vote poll : </b><span>${format(result.value)}</span></div>
                        <div class="tooltip-row"><b>Vote percentage(%): </b><span>${((result.value / data.electors) * 100).toFixed(2)}</span></div>
                    </div> `
                );
            } else {
                tooltip.style("min-width", "200px");
                let result2;
                let result = d;
                if (d.depth === 1) {
                    result2 = partyList.find((p) => p.name === d.data.name);
                }
                while (d.depth > 1) d = d.parent;
                const partyData = partyList.find((p) => p.name === d.data.name);
                const colors = partyData ? partyData.partyColor : color(d.data.name);

                tooltip.html(
                    ` <div class="tooltipBody" style="border: 3px solid ${colors}">
                        <span><b>${result.data.name}${result2 ? `(${result2.fullName})` : ''}</b></span><hr/>
                        <span><b>Total vote poll : </b>${format(result.value)}</span>
                    </div> `
                );
            }
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0);
            tooltip.style("display", "none");
        });;

    const parent = sunburstG.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);

    loadCenterLable(root);

    // Handle zoom on click.
    function clicked(event, p) {
        parent.datum(p.parent || root);

        // path.selectAll("path").style("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0);

        root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        const t = sunburstG.transition().duration(750);
        path.transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function (d) {
                return +this.getAttribute("fill-opacity") || arcVisible(d.target);
            })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
            .attrTween("d", d => () => arc(d.current));

        label.filter(function (d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
        loadCenterLable(p);
    }

    function loadCenterLable(p) {
        sunburstG.selectAll("#centerNode").remove();
        const centerNode = sunburstG
            .append("g")
            .attr("id", "centerNode")
            .attr("transform", () => {
                let d = p;
                while (d.depth > 1) d = d.parent;
                const partyData = partyList.find((pp) => pp.name === d.data.name);
                return partyData ? `translate(0,${radius / 6})` : "translate(0,0)"
            });

        centerNode
            .append("text")
            .attr("id", "nameLable")
            .style("font-size", radius * 0.12)
            .style("font-weight", "bold")
            .attr("transform", "translate(0,0)")
            .style("text-anchor", "middle")
            .text(p.data.name);

        centerNode
            .append("text")
            .attr("id", "votpollLable")
            .style("font-size", radius * 0.1)
            .style("font-weight", "bold")
            .style("text-anchor", "middle")
            .attr("transform", `translate(0,${radius * 0.1})`)
            .text(format(p.value));

        centerNode
            .append("text")
            .attr("id", "votpollLable")
            .style("font-size", radius * 0.1)
            .style("font-weight", "bold")
            .style("text-anchor", "middle")
            .attr("transform", `translate(0,${radius * 0.2})`)
            .text(() => {
                if (!p.data?.children || p.data.children[0].cand_name) {
                    const data = !p.data?.children ? p.data : p.data.children[0];
                    return `${((p.value / data.electors) * 100).toFixed(2)}% `
                }
            });

        centerNode
            .append("defs")
            .append("pattern")
            .attr("id", "centerimage")
            .attr("width", 1)
            .attr("height", 1)
            .append("image")
            .attr("xlink:href", () => {
                while (p.depth > 1) p = p.parent;
                const partyData = partyList.find((pp) => pp.name === p.data.name);
                if (partyData)
                    return `./images/${partyData.name}.png`;
            })
            .attr("width", radius * 0.5)
            .attr("height", radius * 0.5)
            .attr("x", "0")
            .attr("y", "0");

        centerNode.append("rect")
            .attr("width", radius * 0.5)
            .attr("height", radius * 0.5)
            .attr("transform", `translate(-${radius * 0.25},-${radius * 0.7})`)
            .style("fill", `url(#centerimage)`);
    }

    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y}, 0) rotate(${x < 180 ? 0 : 180})`;
    }
}

// ========== Color Variant ============
function getRandomColorVariant(color) {
    // Remove # if present
    color = color.replace('#', '');

    // Split the color into red, green, and blue components
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    // Generate random variations for each component
    let variation = 50; // Adjust this value for more or less variation
    let randomR = Math.max(0, Math.min(255, r + getRandomOffset(variation)));
    let randomG = Math.max(0, Math.min(255, g + getRandomOffset(variation)));
    let randomB = Math.max(0, Math.min(255, b + getRandomOffset(variation)));

    // Convert the random components back to hexadecimal
    let randomColor = "#" + componentToHex(randomR) + componentToHex(randomG) + componentToHex(randomB);

    return randomColor;
}

function getRandomOffset(variation) {
    return Math.floor(Math.random() * (2 * variation + 1)) - variation;
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + '...';
}

function getCorrectTextColor(hex) {
    threshold = 130;
    hRed = hexToR(hex);
    hGreen = hexToG(hex);
    hBlue = hexToB(hex);

    function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
    function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
    function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }
    function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }

    cBrightness = ((hRed * 299) + (hGreen * 587) + (hBlue * 114)) / 1000;
    if (cBrightness > threshold) { return "#000000"; } else { return "#ffffff"; }
}