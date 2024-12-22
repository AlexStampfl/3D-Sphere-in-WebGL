main();

function main() {
    const can = document.getElementById("gl-canvas");
    const gl = can.getContext("webgl");

    if (!gl) {
        alert("Not able to start WebGL.");
        return;
    }

    gl.clearColor(0.3, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, can.width, can.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let rad = 6;
    let theta = 45 * (Math.PI / 180);
    let phi = 6 * (Math.PI / 180);
    let subDiv = 4;
    let isHalted = false;

    function Sliders() {
        document.getElementById("radSlider").addEventListener("input", (e) => {
            rad = parseFloat(e.target.value);
        });
        document.getElementById("thetaSlider").addEventListener("input", (e) => {
            theta = parseFloat(e.target.value) * Math.PI / 180;
        });
        document.getElementById("phiSlider").addEventListener("input", (e) => {
            phi = parseFloat(e.target.value) * Math.PI / 180;
        });
        document.getElementById("subDiv").addEventListener("input", (e) => {
            subDiv = parseInt(e.target.value);
            updateGeo();
        })
        document.getElementById("haltBtn").addEventListener("click", () => {
            isHalted = true;
        });
        document.getElementById("spinBtn").addEventListener("click", () => {
            isHalted = false;
        })
    }

    const vShade = `
        attribute vec3 avPos;
        attribute vec3 aNorm;

        uniform mat4 umVM;
        uniform mat4 uProjMatrix;
        uniform mat3 uNormalMatrix;

        varying vec3 vLighting;

        void main() {
        vec3 transNorm = normalize(uNormalMatrix * aNorm);
        vec3 lightDirection = normalize(vec3(-5.0, -5.0, -10.0)); // change light direction
        
        float directional = max(dot(transNorm, lightDirection), 0.0);
         
        vec3 ambientLight = vec3(0.5, 0.5, 0.5);
        // vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        vec3 directionalLight = vec3(1.0, 1.0, 1.0) * directional;
        vLighting = ambientLight + directionalLight;

        gl_Position = uProjMatrix * umVM * vec4(avPos, 1.0);
}
    `;

    const fShade = `
        precision mediump float;
        varying vec3 vLighting;

        void main() {
            vec3 copperColor = vec3(0.8, 0.5, 0.3);
            float brightness = 1.5; // Increase brightness
            gl_FragColor = vec4(vLighting * copperColor, 1.0);
}
    `;

    // Compile shaders
    const vShader = compileShad(gl, gl.VERTEX_SHADER, vShade);
    const fShader = compileShad(gl, gl.FRAGMENT_SHADER, fShade);

    // Link shaders into program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Program linking error:", gl.getProgramInfoLog(shaderProgram));
        return;
    }

    gl.useProgram(shaderProgram);

    // Terahedron vertices
    const va = [0.0, 0.0, -1.0];
    const vb = [0.0, 0.942809, 0.333333];
    const vc = [-0.816497, -0.471405, 0.333333];
    const vd = [0.816497, -0.471405, 0.333333];

    const positions = [];
    const norms = [];
    const numsToSubdiv = 4;

    // Recursively divide tetrahedron
    tetra(va, vb, vc, vd, numsToSubdiv);

    function myBuffers(gl, shaderProgram, positions, norms, can) 
    {
        const normBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
        
        const aNorm = gl.getAttribLocation(shaderProgram, "aNorm");
        gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNorm);
    
        // Create buffer
        const posBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
        // Set up shader attributes and uniforms
        const aVPos = gl.getAttribLocation(shaderProgram, "avPos");
        if (aVPos === -1) {
            console.error("Attribute avPos not found in the shader program.");
        } else {
            gl.vertexAttribPointer(aVPos, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(aVPos);
        }
        
        gl.vertexAttribPointer(aVPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVPos);
        
        const projMatrix = mat4.create();
        mat4.perspective(projMatrix, 
            Math.PI / 4, // Field of view (45 degrees)
            can.width / can.height, // Aspect ratio
            0.1, // Near clipping plane
            100.0 // Far clippng plane
        );
        const uProjMatrix = gl.getUniformLocation(shaderProgram, "uProjMatrix");
        gl.uniformMatrix4fv(uProjMatrix, false, projMatrix);
        
        const umVM = gl.getUniformLocation(shaderProgram, "umVM");
        const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");

        return { posBuff, normBuff, uProjMatrix, umVM, uNormalMatrix};
    }
    
    const buffers = myBuffers(gl, shaderProgram, positions, norms, can);
    const { posBuff, normBuff, uProjMatrix, umVM, uNormalMatrix } = buffers;
    
    let angle = 0;

    function rend() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        const mVM = mat4.create();
        mat4.translate(mVM, mVM, [0.0, 0.0, -rad]); // change sphere size

        if (!isHalted) {
            angle += 0.001; // only update angle when not paused
        }

        mat4.rotateY(mVM, mVM, angle + theta); // spins sphere around
        mat4.rotateX(mVM, mVM, phi); // tils sphere slightly
        angle += 0.0005; // adjust speed of rotation

        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, mVM);
    
        const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
    
        gl.uniformMatrix4fv(umVM, false, mVM);
        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
    
        requestAnimationFrame(rend);
    }
    
    function updateGeo() {
        positions.length = 0;
        norms.length = 0;
        tetra(va, vb, vc, vd, subDiv);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }
    // Start rendering
    rend();
    Sliders();
    
    function tetra(a, b, c, d, n) {
        divTri(a, b, c, n);
        divTri(d, c, b, n);
        divTri(a, d, b, n);
        divTri(a, c, d, n);
    }

    function divTri(a, b, c, level) {
        if (level > 0) {
            const midAB = normalize(weightedAvg(a, b, 0.5), false);
            const midAC = normalize(weightedAvg(a, c, 0.5), false);
            const midBC = normalize(weightedAvg(b, c, 0.5), false);

            // Recursively subdivide
            divTri(a, midAB, midAC, level - 1);
            divTri(midAB, b, midBC, level - 1);
            divTri(midBC, c, midAC, level - 1);
            divTri(midAB, midBC, midAC, level - 1);
        } else {
            tri(a, b, c);
        }
    }

    function tri(a, b, c) {
        positions.push(...a.slice(0, 3));
        positions.push(...b.slice(0, 3));
        positions.push(...c.slice(0, 3));

        const u = vec3.subtract([], b, a);
        const v = vec3.subtract([], c, a);
        const normal = vec3.normalize([], vec3.cross([], u, v));

        norms.push(...normal);
        norms.push(...normal);
        norms.push(...normal);
    }

    function weightedAvg(u, v, weight) {
        return [
            u[0] * (1 - weight) + v[0] * weight,
            u[1] * (1 - weight) + v[1] * weight,
            u[2] * (1 - weight) + v[2] * weight,
            u[3] * (1 - weight) + v[3] * weight,
        ];
    }

    function normalize(v, useW = false) {
        const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2 + (useW ? v[3] ** 2 : 0));
        return useW
            ? [v[0] / len, v[1] / len, v[2] / len, v[3] / len]
            : [v[0] / len, v[1] / len, v[2] / len];
    }

    // helper function to compile shaders
    function compileShad(g, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
    
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("shader compilation error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader
    }
}