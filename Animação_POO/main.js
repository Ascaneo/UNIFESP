const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

function verticesRetangulo(x0, y0, x1, y1) {
    return new Float32Array([
        x0, y0,
        x0, y1,
        x1, y0,
        x1, y0,
        x0, y1,
        x1, y1
    ]);
}

const verticesBuffer = gl.createBuffer();

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}

const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);

const numComponents = 2;

class ParteRobo {
    constructor(vertices, cor, offsetX, offsetY) {
        this.vertices = vertices;
        this.cor = cor;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.matriz = m3.identity();
    }

    atualizar(tempo) {
        this.matriz = m3.translation(this.offsetX, this.offsetY);
    }

    desenhar() {
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.vertices,
            gl.STATIC_DRAW
        );

        gl.enableVertexAttribArray(positionLocation);

        gl.vertexAttribPointer(
            positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.uniform3fv(
            colorLocation,
            this.cor
        );

        gl.uniformMatrix3fv(
            transformLocation,
            false,
            this.matriz
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            this.vertices.length / numComponents
        );
    }
}

class Cabeca extends ParteRobo {
    atualizar(tempo) {
        let balanco = Math.sin(tempo * 2) * 0.04;
        this.matriz = m3.translation(this.offsetX, this.offsetY + balanco);
    }
}

class Corpo extends ParteRobo {
    atualizar(tempo) {
        let escala = 1 + Math.sin(tempo * 2) * 0.03;

        let matriz = m3.identity();
        matriz = m3.scale(matriz, 1, escala);
        matriz = m3.translate(matriz, this.offsetX, this.offsetY);

        this.matriz = matriz;
    }
}

class Braco extends ParteRobo {
    constructor(vertices, cor, offsetX, offsetY, lado) {
        super(vertices, cor, offsetX, offsetY);
        this.lado = lado;
    }

    atualizar(tempo) {
        let angulo = Math.sin(tempo * 4) * 0.6 * this.lado;

        let matriz = m3.identity();
        matriz = m3.rotate(matriz, angulo);
        matriz = m3.translate(matriz, this.offsetX, this.offsetY);

        this.matriz = matriz;
    }
}

class Perna extends ParteRobo {
    constructor(vertices, cor, offsetX, offsetY, lado) {
        super(vertices, cor, offsetX, offsetY);
        this.lado = lado;
    }

    atualizar(tempo) {
        let angulo = Math.sin(tempo * 4 + Math.PI) * 0.4 * this.lado;

        let matriz = m3.identity();
        matriz = m3.rotate(matriz, angulo);
        matriz = m3.translate(matriz, this.offsetX, this.offsetY);

        this.matriz = matriz;
    }
}

class Robo {
    constructor() {
        this.partes = [];

        this.partes.push(new Perna(
            verticesRetangulo(-0.05, 0, 0.05, -0.4),
            new Float32Array([0.8, 0.8, 0.0]),
            -0.1, -0.3, 1
        ));

        this.partes.push(new Perna(
            verticesRetangulo(-0.05, 0, 0.05, -0.4),
            new Float32Array([0.8, 0.8, 0.0]),
            0.1, -0.3, -1
        ));

        this.partes.push(new Braco(
            verticesRetangulo(-0.05, 0, 0.05, -0.35),
            new Float32Array([0.0, 0.6, 1.0]),
            -0.22, 0.2, -1
        ));

        this.partes.push(new Braco(
            verticesRetangulo(-0.05, 0, 0.05, -0.35),
            new Float32Array([0.0, 0.6, 1.0]),
            0.22, 0.2, 1
        ));

        this.partes.push(new Corpo(
            verticesRetangulo(-0.15, -0.3, 0.15, 0.3),
            new Float32Array([0.6, 0.6, 0.6]),
            0.0, 0.0
        ));

        this.partes.push(new Cabeca(
            verticesRetangulo(-0.12, -0.15, 0.12, 0.15),
            new Float32Array([1.0, 0.0, 0.0]),
            0.0, 0.5
        ));
    }

    atualizar(tempo) {
        for (let parte of this.partes) {
            parte.atualizar(tempo);
        }
    }

    desenhar() {
        for (let parte of this.partes) {
            parte.desenhar();
        }
    }
}

const robo = new Robo();

function drawScene(tempoAtual) {
    let tempo = tempoAtual * 0.001;

    robo.atualizar(tempo);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    robo.desenhar();

    requestAnimationFrame(drawScene);
}

requestAnimationFrame(drawScene);
