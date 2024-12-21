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



    // Vertex Shader
    const vertexShader = `
        attribute vec3 aVertexPosition;
        attribute vec3 aNormal;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat3 uNormalMatrix;

        varying vec3 vLighting;

        void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

        // Transform the normal to world space
        vec3 transformedNormal = normalize(uNormalMatrix * aNormal);

        // Lighting calculation
        vec3 lightDirection = normalize(vec3(0.5, 0.7, 1.0));
        float directional = max(dot(transformedNormal, lightDirection), 0.0);

        vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        vec3 directionalLight = vec3(1.0, 1.0, 1.0) * directional;
        vLighting = ambientLight + directionalLight;
}
    `;
//     // Vertex Shader
//     const vertexShader = `
//         attribute vec3 aVertexPosition;
//         uniform mat4 uModelViewMatrix;
//         uniform mat4 uProjectionMatrix;

//         void main() {
//             gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
// }
//     `;

    const fragmentShader = `
        precision mediump float;
        varying vec3 vLighting;

        void main() {
            vec3 copperColor = vec3(0.8, 0.5, 0.3);
            gl_FragColor = vec4(vLighting * copperColor, 1.0);
}
    `;
//     const fragmentShader = `
//         precision mediump float;
//         varying vec3 vLighting;

//         void main() {
//             gl_FragColor = vec4(vLighting, 1.0);
// }
//     `;
//     const fragmentShader = `
//         precision mediump float;
//         void main() {
//             gl_FragColor = vec4(0.8, 0.5, 0.3, 1.0);
// }
//     `;

    

    // Compile shaders
    const vShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

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
    const normals = [];
    const numTimesToSubdivide = 4;

    // Recursively divide tetrahedron
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    // testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // ~~~~~~~~~~~~~~~~~~This code block causes app to break ~~~~~~~~~~~~~~~~~~~~~~
    
    const aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
    if (aNormal === -1) {
        console.error("Attribute aNormal not found in shader program.")
    } else {
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);
    }
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Set up uniform for normal matrix
    // testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    if (!uNormalMatrix) {
    console.error("Uniform uNormalMatrix not found in the shader program.");
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Set up shader attributes and uniforms
    const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    // testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (aVertexPosition === -1) {
        console.error("Attribute aVertexPosition not found in the shader program.");
    } else {
        gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 
        Math.PI / 4, // Field of view (45 degrees)
        canvas.width / canvas.height, // Aspect ratio
        0.1, // Near clipping plane
        100.0 // Far clippng plane
    );
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");

    let angle = 0;

    // Render function
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, angle);
        angle += 0.01;
    
        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);
    
        const uNormalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
    
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
    
        requestAnimationFrame(render);
    }
    // function render() {
        
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //     // positions the object in the world, move world in opposite direciton of where camera is looking
    //     const modelViewMatrix = mat4.create();
    //     mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]); // Dial object back
    //     // mat4.rotateY(modelViewMatrix, modelViewMatrix, Math.PI / 4); // Rotate camera
    //     mat4.rotateY(modelViewMatrix, modelViewMatrix, angle);

    //     angle += 0.01;

    //     gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

    //     gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

    //     // Request the next frame
    //     requestAnimationFrame(render);
    // }
    // Start rendering
    render();

    // To simulate camera movement, rotation for panning and translation for moving camera

    // gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    

    // Clear and draw
    
    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }

    function divideTriangle(a, b, c, count) {
        if (count > 0) {
            const ab = normalize(mix(a, b, 0.5), false);
            const ac = normalize(mix(a, c, 0.5), false);
            const bc = normalize(mix(b, c, 0.5), false);

            // Recursively subdivide
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

        const u = vec3.subtract([], b, a);
        const v = vec3.subtract([], c, a);
        const normal = vec3.normalize([], vec3.cross([], u, v));

        normals.push(...normal);
        normals.push(...normal);
        normals.push(...normal);
    }
    // function triangle(a, b, c) {
    //     positions.push(...a.slice(0, 3));
    //     positions.push(...b.slice(0, 3));
    //     positions.push(...c.slice(0, 3));
    // }

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
    function compileShader(g, type, source) {
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
    