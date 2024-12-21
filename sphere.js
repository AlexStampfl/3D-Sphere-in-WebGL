main();

function main() {
    const canvas = document.querySelector("#gl-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Define global variables
    let rad = 6;
    let theta = 45 * (Math.PI / 180);
    let phi = 6 * (Math.PI / 180);
    let subDiv = 4;
    let isPaused = false;

    // Update radius, theta, phi & subdivisions
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
    document.getElementById("pauseBtn").addEventListener("click", () => {
        isPaused = true;
    });
    document.getElementById("resumeBtn").addEventListener("click", () => {
        isPaused = false;
    })



    // Vertex Shader
    const vertexShader = `
        attribute vec3 aVertexPosition;
        attribute vec3 aNormal;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjMatrix;
        uniform mat3 uNormalMatrix;

        varying vec3 vLighting;

        void main() {
        vec3 transformedNormal = normalize(uNormalMatrix * aNormal);
        vec3 lightDirection = normalize(vec3(-5.0, -5.0, -10.0)); // change light direction
        
        float directional = max(dot(transformedNormal, lightDirection), 0.0);
         
        vec3 ambientLight = vec3(0.5, 0.5, 0.5);
        // vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        vec3 directionalLight = vec3(1.0, 1.0, 1.0) * directional;
        vLighting = ambientLight + directionalLight;

        gl_Position = uProjMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

}
    `;

    const fragmentShader = `
        precision mediump float;
        varying vec3 vLighting;

        void main() {
            vec3 copperColor = vec3(0.8, 0.5, 0.3);
            float brightness = 1.5; // Increase brightness
            gl_FragColor = vec4(vLighting * copperColor, 1.0);

}
    `;

    // Compile shaders
    const vShader = compileShad(gl, gl.VERTEX_SHADER, vertexShader);
    const fShader = compileShad(gl, gl.FRAGMENT_SHADER, fragmentShader);

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

    // Array to store positions
    const positions = [];
    const norms = [];
    const numsToSubdiv = 4;

    // Recursively divide tetrahedron
    tetra(va, vb, vc, vd, numsToSubdiv);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
    
    const aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
    if (aNormal === -1) {
        console.error("Attribute aNormal not found in shader program.")
    } else {
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);
    }
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    // Create buffer
    const posBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    if (!uNormalMatrix) {
    console.error("Uniform uNormalMatrix not found in the shader program.");
    }

    // Set up shader attributes and uniforms
    const aVPos = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    if (aVPos === -1) {
        console.error("Attribute aVertexPosition not found in the shader program.");
    } else {
        gl.vertexAttribPointer(aVPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVPos);
    }

    gl.vertexAttribPointer(aVPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVPos);

    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, 
        Math.PI / 4, // Field of view (45 degrees)
        canvas.width / canvas.height, // Aspect ratio
        0.1, // Near clipping plane
        100.0 // Far clippng plane
    );
    const uProjMatrix = gl.getUniformLocation(shaderProgram, "uProjMatrix");
    gl.uniformMatrix4fv(uProjMatrix, false, projMatrix);

    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");

    let angle = 0;

    // Render function
    function rend() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -rad]); // change sphere size

        if (!isPaused) {
            angle += 0.001; // only update angle when not paused
        }

        mat4.rotateY(modelViewMatrix, modelViewMatrix, angle + theta); // spins sphere around
        mat4.rotateX(modelViewMatrix, modelViewMatrix, phi); // tils sphere slightly
        angle += 0.0005; // adjust speed of rotation


    
        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);
    
        const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
    
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
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
    
    function tetra(a, b, c, d, n) {
        divTri(a, b, c, n);
        divTri(d, c, b, n);
        divTri(a, d, b, n);
        divTri(a, c, d, n);
    }

    function divTri(a, b, c, count) {
        if (count > 0) {
            const ab = normalize(mix(a, b, 0.5), false);
            const ac = normalize(mix(a, c, 0.5), false);
            const bc = normalize(mix(b, c, 0.5), false);

            // Recursively subdivide
            divTri(a, ab, ac, count - 1);
            divTri(ab, b, bc, count - 1);
            divTri(bc, c, ac, count - 1);
            divTri(ab, bc, ac, count - 1);
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

    function mix(u, v, t) {
        return [
            u[0] * (1 - t) + v[0] * t,
            u[1] * (1 - t) + v[1] * t,
            u[2] * (1 - t) + v[2] * t,
            u[3] * (1 - t) + v[3] * t,
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