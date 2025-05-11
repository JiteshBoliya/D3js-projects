const svgConatiner = document.getElementById("mainContainer");
let width = svgConatiner.clientWidth;
let height = svgConatiner.clientHeight;
const maxAge = 35;
const travelTime = 1500;
const noOfParticals = 3500;
const alphaDecay = 0.95;

let particles = [];
let animationPlay = false;
let lightImageData;
let windData = []; // Placeholder for wind data
let v0, q0, r0, frame;
let timeId = null;

let projection = d3.geoOrthographic()
    .scale(Math.min(height / 2, width / 2) * 0.8)
    .translate([width / 2, height / 2])

let path = d3.geoPath().projection(projection);

const svg = d3
    .select("#mainContainer")
    .append("svg")
    .attr("id", "windSvg")
    .attr('preserveAspectRatio', 'xMinYMid')
    .attr("height", height)
    .attr("width", width);

const graticule = d3.geoGraticule();

const oceanG = svg
    .append("g")
    .attr("id", "oceanG");

oceanG
    .append("path")
    .attr("class", "earth")
    .attr("d", path({ type: "Sphere" }));

const landG = svg
    .append("g")
    .attr("id", "landG");

landG.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

// Canvas wind overlay
let canvasWindOverlay = d3
    .select("#mainContainer")
    .append("canvas")
    .attr("id", "canvasWindOverlay")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    ;

let gl = canvasWindOverlay.node().getContext('webgl', { alpha: true });

// Canvas wind particles
let canvasWindParticles = d3
    .select("#mainContainer")
    .append("canvas")
    .attr("id", "canvasWindParticles")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

let context = canvasWindParticles.node().getContext("2d");

const apis = [
    d3.json("./data/current-wind-surface-level-gfs-1.0.json"),
    d3.json("./data/ne_110m_extra_light.json"),
    d3.json("./data/ne_50m_extra_light@1.json"),
];

Promise.all(apis).then(async ([windRowData, path110, path50]) => {
    path110 = topojson.feature(path110, path110.objects.ne_110m_coastline);
    path50 = topojson.feature(path50, path50.objects.earth_topo_50m);
    windData.push(...windRowData);
    windData = formateWindData(windData);

    async function loadGraph() {
        let radiusAndCenter = getRadiusAndCenter();
        particles = generateParticles(noOfParticals, radiusAndCenter);
        particles.forEach((p) => advanceParticle(p, context, radiusAndCenter));
        startAnimation();

        landG.append("path")
            .attr("class", "coastline")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("d", path(path110))

        // =====================================
        //Raster reprojection with WebGL
        const vertexShader = createVertexShader(gl);
        const fragmentShader = createFragmentShader(gl);
        const vertexBuffer = createVertexBuffer(gl);
        const texture = await createTexture(gl, windOverlay);

        const program = createProgram(gl, vertexShader, fragmentShader);
        const a_vertex = gl.getAttribLocation(program, "a_vertex");
        const u_translate = gl.getUniformLocation(program, "u_translate");
        const u_scale = gl.getUniformLocation(program, "u_scale");
        const u_rotate = gl.getUniformLocation(program, "u_rotate");

        const init = defineInit(gl, program, texture, a_vertex, u_translate, u_scale);
        gl.uniform1f(u_scale, getRadiusAndCenter().r);
        let currentRotation = projection.rotate().map(x => toRadians(x));
        draw(gl, init, u_rotate, [currentRotation[0], currentRotation[1]]);


        // ===============================================

        // Drag and zoom
        const drag = d3.drag()
            .on("start", (event) => {
                animationPlay = false;
                cancelAnimationFrame(frame);
                context2d;
                context.clearRect(0, 0, width, height);
                v0 = versor.cartesian(projection.invert([event.x, event.y]));
                q0 = versor((r0 = projection.rotate()));
            })
            .on("drag", (event) => {
                animationPlay = false;
                cancelAnimationFrame(frame);
                context.clearRect(0, 0, width, height);
                const v1 = versor.cartesian(
                    projection.rotate(r0).invert([event.x, event.y])
                );
                const q1 = versor.multiply(q0, versor.delta(v0, v1));
                const shiftVector = versor.rotation(q1);
                const shiftVectorAdjusted = [shiftVector[0], shiftVector[1], 0];

                projection.rotate(shiftVectorAdjusted);
                currentRotation = projection.rotate().map((x) => toRadians(x));
                draw(gl, init, u_rotate, [currentRotation[0], currentRotation[1]]);

                landG.selectAll("path").attr("d", path);
                landG.selectAll(".coastline").attr("d", path(path110));
            })
            .on("end", () => {
                gl.uniform1f(u_scale, getRadiusAndCenter().r)
                currentRotation = projection.rotate().map(x => toRadians(x))
                draw(gl, init, u_rotate, [currentRotation[0], currentRotation[1]]);
                landG.selectAll(".coastline").attr("d", path(path50));
                startAnimation();
            });

        const zoom = d3.zoom()
            .scaleExtent([200, 1400])
            .on("start", function () {
                animationPlay = false;
                context.clearRect(0, 0, width, height);

            })
            .on("zoom", function (event) {
                projection.scale(event.transform.k);
                oceanG
                    .selectAll("path")
                    .attr("d", path({ type: "Sphere" }));

                landG.selectAll("path").attr("d", path);
                landG.selectAll(".coastline").attr("d", path(path110));

                gl.uniform1f(u_scale, getRadiusAndCenter().r);
                currentRotation = projection.rotate().map((x) => toRadians(x));
                draw(gl, init, u_rotate, [currentRotation[0], currentRotation[1]]);
            })
            .on("end", function () {
                landG.selectAll(".coastline").attr("d", path(path50));
                gl.uniform1f(u_scale, getRadiusAndCenter().r);
                currentRotation = projection.rotate().map((x) => toRadians(x));
                draw(gl, init, u_rotate, [currentRotation[0], currentRotation[1]]);
                startAnimation();
            });

        svg.call(drag).call(zoom);
    }
    loadGraph();

    window.addEventListener("resize", function () {
        width = svgConatiner.clientWidth;
        height = svgConatiner.clientHeight;

        animationPlay = false;
        context.clearRect(0, 0, width, height);

        projection
            .scale(Math.min(height / 2, width / 2) * 0.8)
            .translate([width / 2, height / 2]);

        path.projection(projection);

        svg.attr("height", height).attr("width", width);

        oceanG.selectAll("path").attr("d", path({ type: "Sphere" }));
        landG.selectAll("path").attr("d", path);
        landG.selectAll(".coastline").attr("d", path(path110)); 9

        d3.selectAll("canvas").remove();

        clearTimeout(timeId);
        timeId = setTimeout(() => {
            // Canvas wind overlay
            canvasWindOverlay = d3
                .select("#mainContainer")
                .append("canvas")
                .attr("id", "canvasWindOverlay")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
            gl = canvasWindOverlay.node().getContext('webgl', { alpha: true });

            // Canvas wind particles
            canvasWindParticles = d3
                .select("#mainContainer")
                .append("canvas")
                .attr("id", "canvasWindParticles")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height);
            context = canvasWindParticles.node().getContext("2d");

            loadGraph();
        }, 1000);

    })
});




// Create n particles on an almost uniform grid
function generateParticles(n, radiusAndCenter) {
    const radius = radiusAndCenter.r - 1;
    let x0, y0, coord0;
    particles = [];

    for (let i = 0; i < n; i++) {
        if (radius * 2 > 1.41421 * width) {
            x0 = Math.random() * (width - 1);
            y0 = Math.random() * (height - 1);
        }
        else {
            const randomAngle = Math.random() * 2 * Math.PI;
            const randomRadiusSqrt = Math.random() * radius * radius;
            x0 = Math.sqrt(randomRadiusSqrt) * Math.cos(randomAngle) + width / 2;
            y0 = Math.sqrt(randomRadiusSqrt) * Math.sin(randomAngle) + height / 2;
        }

        coord0 = projection.invert([x0, y0]);
        if (coord0[0] > 180) coord0[0] = -180 + (coord0[0] - 180);

        particles.push({
            x0: x0, y0: y0,
            long0: coord0[0], lat0: coord0[1],
            x: x0, y: y0,
            long: coord0[0], lat: coord0[1],
            age: Math.round(maxAge * Math.random()), visible: true
        });
    }
    return particles;
}

// Set the wave inside the boudray of the earth
function advanceParticle(partical, context, radiusAndCenter) {
    if (partical.age++ > maxAge) {
        partical.x = partical.x0;
        partical.y = partical.y0;
        partical.long = partical.long0;
        partical.lat = partical.lat0;
        partical.age = 0;
        partical.visible = true;
    };

    if (partical.visible) {
        const long_1degTo_m = (Math.PI / 180) * 6378137 * Math.cos(partical.lat * (Math.PI / 180));
        const lat_1degTo_m = 111000;

        let u = bilinearInterpolation(partical.long, partical.lat, "u");
        let v = bilinearInterpolation(partical.long, partical.lat, "v");

        const longDeltaDist = u * travelTime;
        const latDeltaDist = v * travelTime;

        const longDeltaDeg = longDeltaDist / long_1degTo_m;
        const latDeltaDeg = latDeltaDist / lat_1degTo_m;

        let longNew = partical.long + longDeltaDeg;
        let latNew = partical.lat + latDeltaDeg;

        //handle edge cases for long
        if (longNew > 180) {
            longNew -= 360;
        }
        else if (longNew < -180) {
            longNew += 360;
        }

        //handle edge cases for latitude
        if (latNew > 90) {
            partical.visible = false;
        }
        else if (latNew < -90) {
            partical.visible = false;
        }

        partical.long = longNew;
        partical.lat = latNew;

        const xy = projection([partical.long, partical.lat]);
        context.moveTo(partical.x, partical.y);
        partical.x = xy[0];
        partical.y = xy[1];

        const term1 = (partical.x - radiusAndCenter.x0) * (partical.x - radiusAndCenter.x0);
        const term2 = (partical.y - radiusAndCenter.y0) * (partical.y - radiusAndCenter.y0);

        if (term1 + term2 >= radiusAndCenter.r * radiusAndCenter.r) partical.visible = false;
        if (Math.abs(partical.lat) > 90 || Math.abs(partical.long) > 180) partical.visible = false;
        if (partical.visible) context.lineTo(partical.x, partical.y);
        context.strokeStyle = "white";
    }
}

// Show wind animation
function startAnimation() {
    let waitTime;
    const frameRate = 30;
    const frameRateTime = 1000 / frameRate;
    const radiusAndCenter = getRadiusAndCenter();
    particles = generateParticles(noOfParticals, radiusAndCenter);
    animationPlay = true;

    function tick(t) {
        if (!animationPlay) return;

        context.beginPath();
        particles.forEach((p) => advanceParticle(p, context, radiusAndCenter));
        context.stroke();
        context.globalAlpha = alphaDecay;  // opacity
        context.globalCompositeOperation = 'copy';
        context.drawImage(context.canvas, 0, 0);
        context.globalAlpha = 1.0;
        context.globalCompositeOperation = 'source-over';

        waitTime = frameRateTime - (performance.now() - t)
        setTimeout(() => frame = requestAnimationFrame(tick), waitTime);
    }
    tick(performance.now());
}

function formateWindData(windData) {
    let dataObject = new Object();
    let lat = 90;
    let long = 0;
    for (let i = 0; i < windData[0].data.length; i++) {
        const u = windData[0].data[i];
        const v = windData[1].data[i];
        const windStrength = Number(Math.sqrt(u * u + v * v).toFixed(2));
        if (!(long in dataObject)) {
            dataObject[long] = new Object();
        }
        dataObject[long][lat] = {
            "u": u,
            "v": v,
            "wind_strength": windStrength
        };

        //go to next row
        if (long == 180) {
            long = -179;
        }
        else if (long == -1) {
            lat = lat - 1;
            long = 0;
        }
        else {
            long = long + 1;
        }
    }
    dataObject[-180] = dataObject[180];
    return dataObject;
}

// Get the radius and center of the path
function getRadiusAndCenter() {
    let output = new Object()
    if (d3.select('.graticule').node()) {
        output.r = d3.select('.graticule').node().getBBox().width / 2
        output.x0 = d3.select('.graticule').node().getBBox().x + d3.select('.graticule').node().getBBox().width / 2
        output.y0 = d3.select('.graticule').node().getBBox().y + d3.select('.graticule').node().getBBox().height / 2
        return output;
    }
    else {
        output.r = width / 2
        output.x0 = width / 2
        output.y0 = height / 2
        return output;
    }
}


function defineInit(gl, program, texture, a_vertex, u_translate, u_scale) {
    gl.useProgram(program);
    gl.enableVertexAttribArray(a_vertex);
    gl.vertexAttribPointer(a_vertex, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u_translate, width / 2, height / 2);
    gl.uniform1f(u_scale, height / 2 - 1);
    gl.viewport(0, 0, width, height);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Check if the texture is bound
    const boundTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);

    // Verify if the correct texture is bound
    if (boundTexture === texture) {
        console.log("The texture is successfully bound to the canvas.");
    } else {
        console.log("The texture is not bound to the canvas.");
    }
}

// Create vertex buffer
function createVertexBuffer(gl) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.of(-1, -1, +1, -1, +1, +1, -1, +1), gl.STATIC_DRAW);
    return buffer;
}

// Create texture
async function createTexture(gl, imageObject) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, await imageObject());
    return texture;
}

// Create the image 
async function windOverlay() {
    const lightness = 0.75;
    const imageWidth = 4096 / 4;
    const imageHeight = 2048 / 4;
    const arraySize = 4 * imageWidth * imageHeight;
    const projectionOverlay = d3.geoEquirectangular()
        .precision(0.1)
        .fitSize([imageWidth, imageHeight], d3.geoGraticule10());

    //TODO
    let overlayArray = new Uint8ClampedArray(arraySize);

    let x = 0;
    let y = 0;

    for (let i = 0; i < arraySize; i = i + 4) {
        const coords = projectionOverlay.invert([x, y]);
        if (Math.abs(coords[1]) > 90) console.log(x, y, coords, i, arraySize);

        const color = get_color(coords[0], coords[1]);
        overlayArray[i] = color['red'] * lightness;
        overlayArray[i + 1] = color['green'] * lightness;
        overlayArray[i + 2] = color['blue'] * lightness;
        overlayArray[i + 3] = 200;

        //move to the next pixel
        if (x < imageWidth - 1) x = x + 1;
        else {
            x = 0
            y = y + 1
        }
    }

    let overlay_graphics = new ImageData(overlayArray, imageWidth);
    const context = context2d(imageWidth, imageHeight, 1);
    let imageData = new ImageData(overlayArray, imageWidth, imageHeight);
    await createImageBitmap(imageData)
        .then(result => {
            context.drawImage(result, 0, 0, imageWidth, imageHeight);
        })
    return context.canvas;
}

// Create 2d canvas
function context2d(width, height, dpi) {
    if (dpi == null) dpi = devicePixelRatio;
    let canvas = document.createElement("canvas");
    canvas.width = width * dpi;
    canvas.height = height * dpi;
    canvas.style.width = width + "px";
    let context = canvas.getContext("2d");
    context.scale(dpi, dpi);
    return context;
}

// Bind the image with canvas
function draw(gl, init, u_rotate, rotate_angle) {
    init;
    gl.uniform2fv(u_rotate, rotate_angle);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

}

function toRadians(d) {
    if (d < 0) Math.abs(d) * Math.PI / 180;
    return Math.PI + (180 - d) * Math.PI / 180;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
}

/**Bilinear Interpolation : is a resampling method that 
* uses the distanceweighted average of the four nearest 
* pixel values to estimate a new pixel value.*/
function bilinearInterpolation(long, lat, fieldName) {
    let G1, G2, G3, G4;
    let interpolatedValue;
    const i = long;
    const j = lat;
    const f_i = Math.floor(i);
    const c_i = Math.ceil(i);
    const f_j = Math.floor(j);
    const c_j = Math.ceil(j);
    try {
        G1 = windData[f_i][f_j][fieldName];
        G2 = windData[c_i][f_j][fieldName];
        G3 = windData[f_i][c_j][fieldName];
        G4 = windData[c_i][c_j][fieldName];
    }
    catch (err) {
        console.log(long, lat, fieldName);
    }
    const gridDelta_i = 1;
    const gridDelta_j = 1;
    let interpolation_a;
    let interpolation_b;

    if (f_i == c_i) {
        interpolation_a = G1;
        interpolation_b = G3;
    }
    else {
        interpolation_a = (G1 * (c_i - i) / gridDelta_i) + (G2 * (i - f_i) / gridDelta_i);
        interpolation_b = (G3 * (c_i - i) / gridDelta_i) + (G4 * (i - f_i) / gridDelta_i);
    }

    if (f_j == c_j) {
        interpolatedValue = (interpolation_a + interpolation_b) / 2;
    }
    else {
        interpolatedValue = (interpolation_a * (c_j - j) / gridDelta_j) + (interpolation_b * (j - f_j) / gridDelta_j);
    }
    return interpolatedValue;
}

function interpolate_wind_sinebow(t) {
    const end_of_sinebow_scale = 0.3
    const shift_constant = 0.82
    const s = d3.scaleLinear()
        .domain([0, end_of_sinebow_scale])
        .range([0, shift_constant])
    const end_of_sinebow_scale_color = d3.hsl(d3.rgb(
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 0 / 3),
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 1 / 3),
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 2 / 3)
    ))
    const l_scale = d3.scaleLinear()
        .domain([end_of_sinebow_scale, 1])
        .range([end_of_sinebow_scale_color.l, 1])
    let parameter = shift_constant + s(t)

    let interpolated_color = d3.rgb(
        255 * sin2(parameter + 0 / 3),
        255 * sin2(parameter + 1 / 3),
        255 * sin2(parameter + 2 / 3)
    );
    if (t > end_of_sinebow_scale) {
        interpolated_color = d3.hsl(end_of_sinebow_scale_color.h, end_of_sinebow_scale_color.s, l_scale(t)) + ""
    }
    return interpolated_color
}

function sin2(t) {
    return Math.sin(Math.PI * t) ** 2;
}

// Wind color scale
function windColorScale(windStrength) {
    const scale = d3.scaleSequential()
        .domain([0, 200])
        .interpolator(interpolate_wind_sinebow);
    return scale(windStrength);
}

function get_color(long, lat) {
    let windStrength;
    if ((long in windData) && (lat in windData[long])) {
        windStrength = windData[Math.floor(long)][Math.floor(lat)]["wind_strength"];
    }
    else {
        windStrength = bilinearInterpolation(long, lat, "wind_strength");
    }

    const color = windColorScale(windStrength);
    const matchColors = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
    const match = matchColors.exec(color);
    return {
        'red': parseInt(match[1]),
        'green': parseInt(match[2]),
        'blue': parseInt(match[3])
    };
}

// Create Vertex
function createVertexShader(gl) {
    const shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, `
    attribute vec2 a_vertex;
    void main(void) {
      gl_Position = vec4(a_vertex, 0.0, 1.0);
    }
`);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
}

// Create Fragment
function createFragmentShader(gl) {
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, `
    precision highp float;
    uniform sampler2D u_image;
    uniform vec2 u_translate;
    uniform float u_scale;
    uniform vec2 u_rotate;

    const float c_pi = 3.14159265358979323846264;
    const float c_halfPi = c_pi * 0.5;
    const float c_twoPi = c_pi * 2.0;

    float cosphi0 = cos(u_rotate.y);
    float sinphi0 = sin(u_rotate.y);

    void main(void) {
    float x = (gl_FragCoord.x - u_translate.x) / u_scale;
    float y = (u_translate.y - gl_FragCoord.y) / u_scale;

    // inverse orthographic projection
    float rho = sqrt(x * x + y * y);
    if (rho > 1.0) return;
    float c = asin(rho);
    float sinc = sin(c);
    float cosc = cos(c);
    float lambda = atan(x * sinc, rho * cosc);
    float phi = asin(y * sinc / rho);

    // inverse rotation
    float cosphi = cos(phi);
    float x1 = cos(lambda) * cosphi;
    float y1 = sin(lambda) * cosphi;
    float z1 = sin(phi);
    lambda = atan(y1, x1 * cosphi0 + z1 * sinphi0) + u_rotate.x;
    phi = asin(z1 * cosphi0 - x1 * sinphi0);

    gl_FragColor = texture2D(u_image, vec2((lambda + c_pi) / c_twoPi, (phi + c_halfPi) / c_pi));
    }
    `);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
}