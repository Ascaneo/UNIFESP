const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0);
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

const verticesBuffer = gl.createBuffer();

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

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

function drawScene(){
    
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
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
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
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
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
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
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

let tyBE = 0.0;
let tyBD = 0.0;
let txBE_offset = 0.01;
let txBD_offset = 0.01;
let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.005;
let tyBola_offset = 0.005;

let teclas = {};

window.addEventListener("keydown", function(e){
    teclas[e.key] = true;
});

window.addEventListener("keyup", function(e){
    teclas[e.key] = false;
});

function movimentaBarras(){

    if(teclas["w"] || teclas["W"])
        tyBE += txBE_offset;

    if(teclas["s"] || teclas["S"])
        tyBE -= txBE_offset;

    if(tyBE > 0.8) tyBE = 0.8;
    if(tyBE < -0.8) tyBE = -0.8;

    if(teclas["ArrowUp"])
        tyBD += txBD_offset;

    if(teclas["ArrowDown"])
        tyBD -= txBD_offset;

    if(tyBD > 0.8) tyBD = 0.8;
    if(tyBD < -0.8) tyBD = -0.8;

    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);
}

function verificaColisaoBarras(){

    if(txBola - 0.05 <= -0.85 && tyBola >= tyBE - 0.2 && tyBola <= tyBE + 0.2)
        txBola_offset = Math.abs(txBola_offset);

    if(txBola + 0.05 >= 0.85 && tyBola >= tyBD - 0.2 && tyBola <= tyBD + 0.2)
        txBola_offset = -Math.abs(txBola_offset);
}

function atualizaAnimacao(){
    movimentaBarras();

    txBola += txBola_offset;

    verificaColisaoBarras();

    if(txBola > 0.9 || txBola<-0.9)
        txBola_offset = -txBola_offset;

    tyBola += tyBola_offset;
    if(tyBola > 1.0 || tyBola<-1.0)
        tyBola_offset = -tyBola_offset;

    MbolaCentro = m3.translation(txBola,tyBola);
}

drawScene();
