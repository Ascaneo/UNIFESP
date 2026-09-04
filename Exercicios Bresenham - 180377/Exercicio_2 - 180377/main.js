const areaDesenho = document.getElementById("glCanvas");
const contexto = areaDesenho.getContext("webgl");

if (!contexto) {
    alert("WebGL não está disponível.");
}

function gerarShader(contexto, categoria, fonte) {
    const shaderCriado = contexto.createShader(categoria);

    contexto.shaderSource(shaderCriado, fonte);
    contexto.compileShader(shaderCriado);

    if (!contexto.getShaderParameter(shaderCriado, contexto.COMPILE_STATUS)) {
        console.error(contexto.getShaderInfoLog(shaderCriado));
    }

    return shaderCriado;
}

const codigoVertex =
    document.getElementById("vertex-shader").textContent;

const codigoFragment =
    document.getElementById("fragment-shader").textContent;

const shaderVertex = gerarShader(
    contexto,
    contexto.VERTEX_SHADER,
    codigoVertex
);

const shaderFragment = gerarShader(
    contexto,
    contexto.FRAGMENT_SHADER,
    codigoFragment
);

const programa = contexto.createProgram();

contexto.attachShader(programa, shaderVertex);
contexto.attachShader(programa, shaderFragment);

contexto.linkProgram(programa);
contexto.useProgram(programa);

const atributoPosicao =
    contexto.getAttribLocation(programa, "aPosition");

const uniformeResolucao =
    contexto.getUniformLocation(programa, "uResolution");

const uniformeCor =
    contexto.getUniformLocation(programa, "uColor");

const bufferVertices = contexto.createBuffer();

let modoAtual = "reta";
let pontosClicados = [];

let corSelecionada = [0.0, 0.0, 1.0, 1.0];

const paletaCores = {
    "0": [0.0, 0.0, 0.0, 1.0], // preto
    "1": [1.0, 0.0, 0.0, 1.0], // vermelho
    "2": [0.0, 1.0, 0.0, 1.0], // verde
    "3": [0.0, 0.0, 1.0, 1.0], // azul
    "4": [1.0, 1.0, 0.0, 1.0], // amarelo
    "5": [1.0, 0.0, 1.0, 1.0], // magenta
    "6": [0.0, 1.0, 1.0, 1.0], // ciano
    "7": [1.0, 0.5, 0.0, 1.0], // laranja
    "8": [0.5, 0.0, 1.0, 1.0], // roxo
    "9": [1.0, 1.0, 1.0, 1.0]  // branco
};

function alterarCor(teclaPressionada) {
    if (paletaCores[teclaPressionada]) {
        corSelecionada = paletaCores[teclaPressionada];
    }
}

function bresenham(xInicial, yInicial, xFinal, yFinal) {
    const listaPontos = [];

    let atualX = Math.round(xInicial);
    let atualY = Math.round(yInicial);

    const destinoX = Math.round(xFinal);
    const destinoY = Math.round(yFinal);

    const distanciaX = Math.abs(destinoX - atualX);
    const distanciaY = Math.abs(destinoY - atualY);

    const passoX = atualX < destinoX ? 1 : -1;
    const passoY = atualY < destinoY ? 1 : -1;

    let erroAcumulado = distanciaX - distanciaY;

    while (true) {
        listaPontos.push(atualX);
        listaPontos.push(atualY);

        if (atualX === destinoX && atualY === destinoY) {
            break;
        }

        const erroDuplicado = 2 * erroAcumulado;

        if (erroDuplicado > -distanciaY) {
            erroAcumulado -= distanciaY;
            atualX += passoX;
        }

        if (erroDuplicado < distanciaX) {
            erroAcumulado += distanciaX;
            atualY += passoY;
        }
    }

    return listaPontos;
}

function desenharPontos(vertices) {
    contexto.bindBuffer(contexto.ARRAY_BUFFER, bufferVertices);

    contexto.bufferData(
        contexto.ARRAY_BUFFER,
        new Float32Array(vertices),
        contexto.STATIC_DRAW
    );

    contexto.enableVertexAttribArray(atributoPosicao);

    contexto.vertexAttribPointer(
        atributoPosicao,
        2,
        contexto.FLOAT,
        false,
        0,
        0
    );

    contexto.uniform2f(
        uniformeResolucao,
        areaDesenho.width,
        areaDesenho.height
    );

    contexto.uniform4fv(uniformeCor, corSelecionada);

    contexto.drawArrays(
        contexto.POINTS,
        0,
        vertices.length / 2
    );
}

function limparTela() {
    contexto.clearColor(0.8, 0.8, 0.8, 1.0);
    contexto.clear(contexto.COLOR_BUFFER_BIT);
}

function desenharLinha(xInicio, yInicio, xFim, yFim) {
    limparTela();

    const vertices =
        bresenham(xInicio, yInicio, xFim, yFim);

    desenharPontos(vertices);
}

function desenharTriangulo(x1, y1, x2, y2, x3, y3) {
    limparTela();

    const primeiroLado =
        bresenham(x1, y1, x2, y2);

    const segundoLado =
        bresenham(x2, y2, x3, y3);

    const terceiroLado =
        bresenham(x3, y3, x1, y1);

    const vertices = [
        ...primeiroLado,
        ...segundoLado,
        ...terceiroLado
    ];

    desenharPontos(vertices);
}

areaDesenho.addEventListener("mousedown", function(evento) {
    if (evento.button !== 0) {
        return;
    }

    const limites = areaDesenho.getBoundingClientRect();

    const posicaoX = evento.clientX - limites.left;

    // Inverte o eixo Y para o sistema do WebGL
    const posicaoY =
        areaDesenho.height - (evento.clientY - limites.top);

    pontosClicados.push({
        x: posicaoX,
        y: posicaoY
    });

    if (modoAtual === "reta" && pontosClicados.length === 2) {
        desenharLinha(
            pontosClicados[0].x,
            pontosClicados[0].y,
            pontosClicados[1].x,
            pontosClicados[1].y
        );

        pontosClicados = [];
    }

    if (
        modoAtual === "triangulo" &&
        pontosClicados.length === 3
    ) {
        desenharTriangulo(
            pontosClicados[0].x,
            pontosClicados[0].y,
            pontosClicados[1].x,
            pontosClicados[1].y,
            pontosClicados[2].x,
            pontosClicados[2].y
        );

        pontosClicados = [];
    }
});

window.addEventListener("keydown", function(evento) {
    const teclaPressionada = evento.key;

    alterarCor(teclaPressionada);

    if (
        teclaPressionada === "r" ||
        teclaPressionada === "R"
    ) {
        modoAtual = "reta";
        pontosClicados = [];
    }

    if (
        teclaPressionada === "t" ||
        teclaPressionada === "T"
    ) {
        modoAtual = "triangulo";
        pontosClicados = [];
    }
});

contexto.viewport(
    0,
    0,
    areaDesenho.width,
    areaDesenho.height
);

// Linha inicial azul entre (0,0) e (0,0)
desenharLinha(0, 0, 0, 0);