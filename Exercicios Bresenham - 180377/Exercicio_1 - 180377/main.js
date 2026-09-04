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

let inicioX = 0;
let inicioY = 0;
let fimX = 0;
let fimY = 0;

let aguardandoPrimeiroClique = true;

// Cor inicial azul
let corSelecionada = [0.0, 0.0, 1.0, 1.0];

// Cores associadas às teclas de 0 a 9
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
        desenharLinha();
    }
}

// Algoritmo de Bresenham
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

function desenharLinha() {
    const vertices = bresenham(inicioX, inicioY, fimX, fimY);

    contexto.clearColor(0.8, 0.8, 0.8, 1.0);
    contexto.clear(contexto.COLOR_BUFFER_BIT);

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

    // A reta é desenhada ponto a ponto, sem GL_LINES
    contexto.drawArrays(
        contexto.POINTS,
        0,
        vertices.length / 2
    );
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

    if (aguardandoPrimeiroClique) {
        inicioX = posicaoX;
        inicioY = posicaoY;
        aguardandoPrimeiroClique = false;
    } else {
        fimX = posicaoX;
        fimY = posicaoY;
        aguardandoPrimeiroClique = true;

        desenharLinha();
    }
});

window.addEventListener("keydown", function(evento) {
    alterarCor(evento.key);
});

contexto.viewport(
    0,
    0,
    areaDesenho.width,
    areaDesenho.height
);

// Linha inicial azul entre (0,0) e (0,0)
desenharLinha();