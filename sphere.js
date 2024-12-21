
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
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}
    `;

    const fragmentShader = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(0.8, 0.5, 0.3, 1.0);
}
    `;

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
    const numTimesToSubdivide = 4;

    // Recursively divide tetrahedron
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Set up shader attributes and uniforms
    const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
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

        // positions the object in the world, move world in opposite direciton of where camera is looking
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]); // Dial object back
        // mat4.rotateY(modelViewMatrix, modelViewMatrix, Math.PI / 4); // Rotate camera
        mat4.rotateY(modelViewMatrix, modelViewMatrix, angle);

        angle += 0.01;

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

        // Request the next frame
        requestAnimationFrame(render);
    }
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
    