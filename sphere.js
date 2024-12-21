// main();

// function main() 
// {
//     const canvas = document.querySelector("#gl-canvas");
//     // Initialize gl context
//     const gl = canvas.getContext("webgl");

//     // Only continue if WebGL is available and working
//     if (!gl) {
//         alert("Unable to initialize WebGL.");
//         return;
//     }

//     gl.clearColor(0.0, 0.0, 0.0, 1.0);
//     gl.enable(gl.DEPTH_TEST); // enable depth testing
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//     // Vertex shader
//     const vertexShader = `
//         attribute vec4 aVertexPosition;
//         attribute vec3 aNormal;
    
//         uniform mat4 uModelViewMatrix;
//         uniform mat4 uProjectionMatrix;
//         uniform mat3 uNormalMatrix;

//         varying vec3 vLighting;

//         void main() {
//             gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            
//             // Transform the normal to world coordinates
//             vec3 transformedNormal = uNormalMatrix * aNormal;

//             // Calculate directional light
//             vec3 lightDirection = normalize(vec3(0.0, 0.0, -1.0));
//             float directional = max(dot(transformedNormal, lightDirection), 0.0);

//             // Ambient + Diffuse lighting
//             vec3 ambientLight = vec3(0.2, 0.2, 0.2);
//             vec3 directionalLight = vec3(1.0, 1.0, 1.0) * directional;
//             vLighting = ambientLight + directionalLight;
//         }
//     `;
    
//     const fragmentShader = `
//         varying vec3 vLighting;

//         void main() {
//             // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
//             gl_FragColor = vec4(vLighting, 1.0);
//         }
//     `;
    
//     // Compile Vertex Shader
//     const vShader = gl.createShader(gl.VERTEX_SHADER);
//     gl.shaderSource(vShader, vertexShader);
//     gl.compileShader(vShader);
//     if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
//         console.log("Vertex shader compilation error:", gl.getShaderInfoLog(vShader));
//         gl.deleteShader(vShader);
//     }

//     // Compile Fragment Shader
//     const fShader = gl.createShader(gl.FRAGMENT_SHADER);
//     gl.shaderSource(fShader, fragmentShader);
//     gl.compileShader(fShader);
//     if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
//         console.log("Fragment shader compilation error:", gl.getShaderInfoLog(fShader));
//         gl.deleteShader(fShader);
//     }

//     // Create and link the shader program
//     const shaderProgram = gl.createProgram();
//     gl.attachShader(shaderProgram, vShader);
//     gl.attachShader(shaderProgram, fShader);
//     gl.linkProgram(shaderProgram);
//     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
//         console.log("Program linking error:", gl.getProgramInfoLog(shaderProgram));
//     }

//     gl.useProgram(shaderProgram);
    
//     const va = vec4.fromValues(0.0, 0.0, -1.0, 1.0);
//     const vb = vec4.fromValues(0.0, 0.942809, 0.333333, 1.0);
//     const vc = vec4.fromValues(-0.816497, -0.471405, 0.333333, 1.0);
//     const vd = vec4.fromValues(0.816497, -0.471405, 0.333333, 1.0);

//     const numTimesToSubdivide = 4; // Adjust for recursion depth
//     const positions = []; // Sphere vertices will go here
//     const normals = [];

//     // initiate the recursion
//     tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

//     const positionBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

//     const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
//     gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(aVertexPosition);

//     //Perspective and ModelView Matrices
//     const projectionMatrix = mat4.create();
//     mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 10.0);

//     const modelViewMatrix = mat4.create();
//     mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -2.0]);
//     // const identityMatrix = mat4.create();

//     const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
//     const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");

//     //gl.uniformMatrix4fv(uModelViewMatrix, false, identityMatrix);
//     gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
//     // gl.uniformMatrix4fv(uProjectionMatrix, false, identityMatrix);
//     gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);


//     const normalBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

//     const normalMatrix = mat3.create();
//     mat3.normalFromMat4(normalMatrix, modelViewMatrix);
//     const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
//     gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);


//     const aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
//     gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(aNormal);



//     //gl.clear(gl.COLOR_BUFFER_BIT);
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//     gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

//     function tetrahedron(a, b, c, d, n) {
//         divideTriangle(a, b, c, n);
//         divideTriangle(d, c, b, n);
//         divideTriangle(a, d, b, n);
//         divideTriangle(a, c, d, n);
//     }

//     function mix(u, v, t) {
//         return [
//             u[0] * (1 - t) + v[0] * t,
//             u[1] * (1 - t) + v[1] * t,
//             u[2] * (1 - t) + v[2] * t,
//             u[3] * (1 - t) + v[3] * t,
//         ];
//     }

//     function normalize(v, useW = false) {
//         const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2 + (useW ? v[3] ** 2 : 0));
//         return useW
//             ? [v[0] / len, v[1] / len, v[2] / len, v[3] / len]
//             : [v[0] / len, v[1] / len, v[2] / len];
//     }

//     function divideTriangle(a, b, c, count) {
//         if (count > 0) {
//             const ab = normalize(mix(a, b, 0.5), true);
//             const ac = normalize(mix(a, c, 0.5), true);
//             const bc = normalize(mix(b, c, 0.5), true);

//             divideTriangle(a, ab, ac, count - 1);
//             divideTriangle(ab, b, bc, count - 1);
//             divideTriangle(bc, c, ac, count - 1);
//             divideTriangle(ab, bc, ac, count - 1);
//             }
//         else {
//             triangle(a, b, c);
//         }
//     }

//     // function triangle(a, b, c) {
//     //     positions.push(...a.slice(0, 3), ...b.slice(0, 3.5), ...c.slice(0, 3));
//     // }
//     // function triangle(a, b, c) {
//     //     let index = 0;
//     //     positions.push(a);
//     //     positions.push(a);
//     //     positions.push(a);
//     //     index += 3;
//     // }
//     function triangle(a, b, c) {
//         //let index = 0;
//         // Push all three vertices (a, b, c) to positions as flat arrays
//         positions.push(...a.slice(0, 3)); // Only x, y, z
//         positions.push(...b.slice(0, 3)); // Only x, y, z
//         positions.push(...c.slice(0, 3)); // Only x, y, z

//         normals.push(...normalize(a).slice(0, 3));
//         normals.push(...normalize(b).slice(0, 3));
//         normals.push(...normalize(c).slice(0, 3));
    
//         // // Increment index for tracking triangles (optional)
//         // index += 3;
//     }

    
// }


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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Vertex shader
    const vertexShader = `
        attribute vec4 aVertexPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vLighting;

precision mediump float;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    // Transform the normal to world coordinates
    vec3 transformedNormal = uNormalMatrix * aNormal;

    // Calculate directional light
    vec3 lightDirection = normalize(vec3(0.0, 0.0, -1.0));
    float directional = max(dot(transformedNormal, lightDirection), 0.0);

    // Ambient + Diffuse lighting
    vec3 ambientLight = vec3(0.2, 0.2, 0.2);
    vec3 directionalLight = vec3(1.0, 1.0, 1.0) * directional;
    vLighting = ambientLight + directionalLight;
}
    `;

    const fragmentShader = `
        precision mediump float;

varying vec3 vLighting;

void main() {
    gl_FragColor = vec4(vLighting, 1.0);
}
    `;

    // Compile shaders and link program
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vertexShader);
    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
        console.error("Vertex shader compilation error:", gl.getShaderInfoLog(vShader));
        gl.deleteShader(vShader);
    }

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fragmentShader);
    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
        console.error("Fragment shader compilation error:", gl.getShaderInfoLog(fShader));
        gl.deleteShader(fShader);
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Program linking error:", gl.getProgramInfoLog(shaderProgram));
    }

    gl.useProgram(shaderProgram);

    const va = vec4.fromValues(0.0, 0.0, -1.0, 1.0);
    const vb = vec4.fromValues(0.0, 0.942809, 0.333333, 1.0);
    const vc = vec4.fromValues(-0.816497, -0.471405, 0.333333, 1.0);
    const vd = vec4.fromValues(0.816497, -0.471405, 0.333333, 1.0);

    const numTimesToSubdivide = 4;
    const positions = [];
    const normals = [];

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 10.0);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -2.0]);

    const normalMatrix = mat3.create();
    mat3.normalFromMat4(normalMatrix, modelViewMatrix);

    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");

    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
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

    function divideTriangle(a, b, c, count) {
        if (count > 0) {
            const ab = normalize(mix(a, b, 0.5), true);
            const ac = normalize(mix(a, c, 0.5), true);
            const bc = normalize(mix(b, c, 0.5), true);

            divideTriangle(a, ab, ac, count - 1);
            divideTriangle(ab, b, bc, count - 1);
            divideTriangle(bc, c, ac, count - 1);
            divideTriangle(ab, bc, ac, count - 1);
        } else {
            triangle(a, b, c);
        }
    }

    function triangle(a, b, c) {
        positions.push(...a.slice(0, 3));
        positions.push(...b.slice(0, 3));
        positions.push(...c.slice(0, 3));

        normals.push(...normalize(a).slice(0, 3));
        normals.push(...normalize(b).slice(0, 3));
        normals.push(...normalize(c).slice(0, 3));
    }
}