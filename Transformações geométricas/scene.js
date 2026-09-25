// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer =
            new Renderer(gl, program);

        // Figura que será exibida
        this.helicopterBody = new HelicopterBody();

        this.helicopterTopShaft = new HelicopterTopShaft();

        this.helicopterTail = new HelicopterTail();

        this.helicopterPropellers = new HelicopterPropellers();

        this.helicopterTailPropeller = new HelicopterTailPropeller();

        // Posição do helicóptero na cena
        this.posX = 0.0;
        this.posY = 0.0;
        this.velocidade = 0.015;

        // Ângulos de rotação das hélices
        this.thetaTopo = 0.0;
        this.thetaCauda = 0.0;

        this.teclas = {};

        window.addEventListener("keydown", (e) => {
            this.teclas[e.key] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.teclas[e.key] = false;
        });
    }

    movimentar() {

        if (this.teclas["ArrowUp"]) this.posY += this.velocidade;
        if (this.teclas["ArrowDown"]) this.posY -= this.velocidade;
        if (this.teclas["ArrowLeft"]) this.posX -= this.velocidade;
        if (this.teclas["ArrowRight"]) this.posX += this.velocidade;

        if (this.posX > 0.4) this.posX = 0.4;
        if (this.posX < -0.4) this.posX = -0.4;
        if (this.posY > 0.4) this.posY = 0.4;
        if (this.posY < -0.4) this.posY = -0.4;
    }

    update() {

        this.movimentar();

        this.thetaTopo += 0.15;
        this.thetaCauda += 0.35;

        const posicao =
            m4.translation(this.posX, this.posY, 0);

        this.helicopterBody.update(posicao);
        this.helicopterTopShaft.update(posicao);
        this.helicopterTail.update(posicao);

        this.helicopterPropellers.update(
            m4.translate(
                m4.yRotation(this.thetaTopo),
                this.posX,
                this.posY,
                0
            )
        );

        this.helicopterTailPropeller.update(
            m4.translate(
                m4.xRotation(this.thetaCauda),
                this.posX,
                this.posY,
                0
            )
        );
    }

    draw() {

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(program);

        this.helicopterBody.draw(
            this.renderer
        );

        this.helicopterTopShaft.draw(
            this.renderer
        );

        this.helicopterTail.draw(
            this.renderer
        );

        this.helicopterPropellers.draw(
            this.renderer
        );

        this.helicopterTailPropeller.draw(
            this.renderer
        );
    }

    execute() {

        this.update();
        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }

    init() {

        requestAnimationFrame(
            () => this.execute()
        );
    }
}

