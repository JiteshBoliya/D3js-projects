const width = 1000;
const height = 1500;
const imagesize = 35;
const legendLable = "Current nominations";
const api = "./data.json";
let hoveredMovieLinks = [];
let isDarkMode = false;

const catagory = ['Best Picture', 'Best Director', 'Best Writing', 'Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress'];
const roleType = ["actor", "producer", "director"];
const movieHover = ["win", "hover", "none"];
const legendList = [
    { name: "actor", value: "Actor" },
    { name: "producer", value: "Producer" },
    { name: "director", value: "Director" },
    { name: "other", value: "Multiple roles" }
];

const colorCodes1 = ["#3182bd", "#42a48d", "#7d4098", "#87003a", "#87003a"]; // Dark colors
const colorCodes2 = ["#b6cfe2", "#caddd9", "#d6c6dd", "#e3a2be", "#e3a2be"]; // light colors
const colorCodes3 = ["#42a48d", "#7d4098", "#969696", "#3182bd", "#3182bd", "#3182bd", "#3182bd"]; // Same like dark color but for catagories
const colorCodes4 = ["gray", "black", "none"]; // Color of movie node
const colorCodes5 = ["#48525a", "#42534f", "#4a3653", "#5c0027", "#5c0027"] //Darkmode colors for links 

const roleTypeColorScale = d3.scaleOrdinal().domain(roleType).range(colorCodes1);
const roleTypeColorScaleLinks = d3.scaleOrdinal().domain(roleType).range(colorCodes2);
const tooltipColorScale = d3.scaleOrdinal().domain(catagory).range(colorCodes3)
const movieColorScale = d3.scaleOrdinal().domain(movieHover).range(colorCodes4);
const roleTypeDarkColorScale = d3.scaleOrdinal().domain(roleType).range(colorCodes5);

d3.json(api).then((data) => {
    const { movies, persons } = data;

    // Adding id to the movies and persons
    movies.forEach((m, i) => {
        m.links.forEach((l) => {
            l.person = persons[l.person];
        })
        m.id = 'm' + i;
    });
    persons.forEach((p, i) => { p.id = 'p' + i });

    const svg = d3
        .select("#oscarMap")
        .append("svg")
        .attr("class", "oscarSvg")
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Tooltip
    const tooltip = d3
        .select("#tooltip")
        .attr("class", "tooltip tooltip-light");

    // Image Clip
    const clipPath = svg.append("clipPath")
        .attr("id", "roundClip");

    clipPath.append("circle")
        .attr("r", imagesize);

    // Link genration
    const linkData = [];
    movies.forEach((m) => {
        m.links.forEach((l) => {
            linkData.push({
                "id": m.id,
                "name": m.name,
                "personName": l.person.name,
                "role": l.role,
                "sourceX": m.x,
                "sourceY": m.y,
                "linkX": l.x,
                "linkY": l.y,
                "targetX": l.person.x,
                "targetY": l.person.y,
            });
        })
    });

    // Links
    const links = svg
        .append("g")
        .attr("id", "links");

    const link1 = links
        .append("g")
        .attr("id", "link1")
        .selectAll("Links1")
        .data(linkData)
        .join("path")
        .attr("d", (d) => `M ${d.sourceX},${d.sourceY} S ${d.linkX},${d.linkY} ${d.targetX},${d.targetY}`)
        .style("fill", "none")
        .style("stroke", (d) => roleTypeColorScaleLinks(d.role))
        .style("stroke-width", 15)
        .style("stroke-linecap", "round");

    const link2 = links
        .append("g")
        .attr("id", "link2")
        .selectAll("Links2")
        .data(linkData)
        .join("path")
        .attr("d", (d) => `M ${d.sourceX},${d.sourceY} S ${d.linkX},${d.linkY} ${d.targetX},${d.targetY}`)
        .style("fill", "none")
        .style("stroke", "white");

    // Movie
    const movieNode = svg
        .append('g')
        .attr("id", "movienode");

    const movie = movieNode
        .append("g")
        .attr("id", "moviecircle")
        .selectAll("movieCircles")
        .data(movies)
        .join("circle")
        .attr("r", 4)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("class", "movieCircle")
        .style("fill", "white");


    // Filter show movie lables
    const showLables = movies.filter((m) => m.label);
    const movieLable = movieNode
        .append("g")
        .attr("id", "movieLable")
        .selectAll("MovieLables")
        .data(showLables)
        .join("text")
        .text((d) => d.name)
        .attr("x", (d) => d.label.x)
        .attr("y", (d) => d.label.y)
        .attr("class", "movieLable")
        .style("text-anchor", "middle");

    // Filter the oscar won moives
    const wonList = [];
    persons.forEach((p) => { wonList.push(...p.nominations.filter((n) => n.won)) })
    const wonMovieList = wonList.map((w) => movies[w.movie]);

    const movieSubNodes = movieNode
        .append("g")
        .attr("id", "moviesubcircle")
        .selectAll("moviesubCircles")
        .data(movies)
        .join("circle")
        .attr("id", (d) => d.id)
        .attr("r", 2)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .style("fill", (d) => wonMovieList.find((w) => w.name === d.name) ? movieColorScale("won") : movieColorScale("none"));

    // Link hover
    link1
        .on("mouseover", (event, d) => {
            mouseOver(event, movies.find((m) => m.id === d.id), hoveredMovieLinks);
        })
        .on("mouseout", mouseOut);

    movie
        .on("mouseover", (event, d) => mouseOver(event, d, hoveredMovieLinks))
        .on("mouseout", mouseOut);

    movieSubNodes
        .on("mouseover", (event, d) => mouseOver(event, d, hoveredMovieLinks))
        .on("mouseout", mouseOut);

    // Person
    const personNode = svg
        .append("g")
        .attr("id", "personNode")

    const person = personNode
        .append("g")
        .attr("id", "persionCircle")
        .selectAll("persionCircles")
        .data(persons)
        .join("circle")
        .attr("id", (d) => d.id)
        .attr("r", 20)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .style("fill", (d) => roleTypeColorScale(d.type))

    const personName = personNode
        .append("g")
        .attr("id", "personname")
        .selectAll("names")
        .data(persons)
        .join("text")
        .text((d) => d.name)
        .attr("class", "personName")
        .attr("x", (d) => d.label.x)
        .attr("y", (d) => d.label.y)
        .style("text-anchor", "middle")
        .style("fill", (d) => roleTypeColorScale(d.type));

    const personImage = personNode
        .append("g")
        .attr("id", "personImage")
        .selectAll("Images")
        .data(persons)
        .join("image")
        .attr("xlink:href", (d) => `./images/${d.name.replace(/\s/g, '_')}.jpg`)
        .attr("height", imagesize)
        .attr("width", imagesize)
        .attr("class", "round-image")
        .attr("clip-path", "url(#roundClip)")
        .attr("x", (d) => d.x - imagesize / 2)
        .attr("y", (d) => d.y - imagesize / 2);

    personHover(person);
    personHover(personImage);

    const legend = svg
        .append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${width - 100},50)`);

    const legendTitle = legend
        .append("text")
        .text(legendLable)
        .attr("x", -15)
        .attr("y", -15)
        .attr("class", "legendFont")
        .style("font-weight", "bold")
        .style("font-size", "10px");

    legend
        .selectAll("points")
        .data(legendList)
        .join("circle")
        .attr("r", 5)
        .attr("cx", 0)
        .attr("cy", (d, i) => i * 20)
        .style("fill", (d) => roleTypeColorScale(d.name));

    const legendPoints = legend
        .selectAll("points")
        .data(legendList)
        .join("circle")
        .attr("r", 2)
        .attr("cx", 0)
        .attr("cy", (d, i) => i * 20)
        .style("fill", "white");

    legend
        .selectAll("lables")
        .data(legendList)
        .join("text")
        .text((d) => d.value)
        .attr("x", 10)
        .attr("y", (d, i) => (i * 20) + 3) // +3 for top spacing
        .attr("class", "legendFont")
        .style("fill", (d) => roleTypeColorScale(d.name))

    function personHover(selection) {
        selection
            .on("mouseover", function (event, d, i) {
                links
                    .append("g")
                    .attr("id", "hoverdLinks")
                    .selectAll("hoverdLink")
                    .data(linkData.filter((l) => l.personName === d.name))
                    .join("path")
                    .attr("d", (d) => `M  ${d.targetX},${d.targetY} C ${d.linkX},${d.linkY} ${d.sourceX},${d.sourceY}  ${d.sourceX},${d.sourceY}`)
                    .attr("fill", "none")
                    .style("stroke-width", 1.5)
                    .attr("stroke", () => isDarkMode ? "white" : "black")
                    .style("stroke-dasharray", "0,250")
                    .transition()
                    .duration(1000)
                    .ease(d3.easeCubic)
                    .style("stroke-dasharray", "250,250");

                d3.select(`#${d.id}`).style("fill", () => isDarkMode ? "white" : "black");
            })
            .on("mouseout", mouseOut)
    }

    refreshTooltipData();

    // Mouse event methods
    function mouseOver(event, hoverdMovie, hoveredMovieLinks) {

        hoverdMovie.links.forEach((hm) => {
            hm.person.nominations.forEach((pn) => {
                if (pn.movie == hoverdMovie.id.replace('m', '')) {
                    tooltipData.map((t) => {
                        if (t.catagory === pn.name) {
                            t.names.push(hm.person.name);
                            t.won = pn.won ? true : false;
                        }
                    })

                }
            })
        })

        tooltip
            .style("display", "block")
            .html(
                `<div><h4 class="tooltipTitle">${hoverdMovie.name}(${hoverdMovie.year})</h4></div>
                ${getTooltipData(tooltipData)}
                `
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + "px");


        hoverdMovie.links.forEach((l) => {
            hoveredMovieLinks.push({
                "sourceX": hoverdMovie.x,
                "sourceY": hoverdMovie.y,
                "linkX": l.x,
                "linkY": l.y,
                "targetX": l.person.x,
                "targetY": l.person.y
            });
        });

        links
            .append("g")
            .attr("id", "hoverdLinks")
            .selectAll("hoverdLink")
            .data(hoveredMovieLinks)
            .join("path")
            .attr("d", (d) => `M ${d.sourceX}, ${d.sourceY} S ${d.linkX}, ${d.linkY} ${d.targetX}, ${d.targetY} `)
            .style("fill", "none")
            .style("stroke-width", 1.5)
            .style("stroke", () => isDarkMode ? "white" : "black")
            .style("stroke-dasharray", "0,250")
            .transition()
            .duration(1000)
            .ease(d3.easeCubic)
            .style("stroke-dasharray", "250,250");

        d3
            .selectAll(`#${hoverdMovie.id} `)
            .style("fill", () => isDarkMode ? "white" : movieColorScale("hover"));
    }

    function getTooltipData(data) {
        let result = data.map((d) => {
            if (d.names.length) {
                return `<div class="tooltipList"><p>${d.catagory}</p> :  <p style="color:${tooltipColorScale(d.catagory)}" >${d.names.join(", ")}</p> ${d.won ? '<p> ✔ </p>' : ''}</div>`
            }
        })
        return result.filter((r) => r != undefined).join('');
    }

    function mouseOut() {
        d3.selectAll("#hoverdLinks").remove();
        movieSubNodes.style("fill", (d) => wonMovieList.find((w) => w.name === d.name) ? movieColorScale("won") : movieColorScale("none"));
        person.style("fill", (d) => roleTypeColorScale(d.type))
        tooltip.style("display", "none");
        refreshTooltipData();
        hoveredMovieLinks = [];
    }

    function refreshTooltipData() {
        tooltipData = [];
        catagory.forEach((c) => {
            tooltipData.push({ catagory: c, names: [], won: false });
        })
    }

    // Dark mode
    const themeElement = document.getElementById("flexSwitchCheckDefault");
    const navbar = document.getElementById("navbar");
    const body = document.getElementById("body");
    const toolTip = document.getElementById("tooltip");

    themeElement.addEventListener("change", () => {
        link1.style("stroke", (d) => !isDarkMode ? roleTypeDarkColorScale(d.role) : roleTypeColorScaleLinks(d.role));
        legendTitle.style("fill", () => !isDarkMode ? "white" : "black");

        if (themeElement.checked) {
            navbar.classList.remove("bg-light");
            navbar.classList.add("bg-dark");
            body.classList.add("darkTheme");

            toolTip.classList.add("tooltip-dark");
            toolTip.classList.remove("tooltip-light");

            movie.style("fill", "black");
            link2.style("stroke", "black");
            movieLable.style("fill", "white");
            legendPoints.style("fill", "black");
            isDarkMode = true;

        } else {
            navbar.classList.remove("bg-dark");
            navbar.classList.add("bg-light");
            body.classList.remove("darkTheme");

            toolTip.classList.remove("tooltip-dark");
            toolTip.classList.add("tooltip-light");

            movie.style("fill", "white");
            link2.style("stroke", "white");
            movieLable.style("fill", "gray");
            legendPoints.style("fill", "white");
            isDarkMode = false;
        }
    });
})




