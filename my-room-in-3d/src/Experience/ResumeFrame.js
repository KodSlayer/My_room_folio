import * as THREE from 'three'
import Experience from './Experience.js'

export default class ResumeFrame
{
    constructor()
    {
        this.experience = new Experience()
        this.resources  = this.experience.resources
        this.debug      = this.experience.debug
        this.scene      = this.experience.scene
        this.camera     = this.experience.camera

        this.mouseDownPos = { x: 0, y: 0 }
        this.isDragging   = false
        this.raycaster    = new THREE.Raycaster()
        this.mouse        = new THREE.Vector2()
        this.clickables   = []

        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder({
                title: 'resumeFrame',
                expanded: false
            })
        }

        this.setModel()
        this.setModal()
        this.setClickHandler()
    }

    // ─────────────────────────────────────────────────────────────────
    //  3-D frame on the wall
    // ─────────────────────────────────────────────────────────────────
    setModel()
    {
        this.model = {}
        this.model.group = new THREE.Group()
        this.model.group.position.set(4.2, 4.9, 1.8)
        this.model.group.rotation.y = -Math.PI * 0.5
        this.scene.add(this.model.group)

        const frameWidth  = 0.75
        const frameHeight = 1.05
        const frameDepth  = 0.004
        const borderSize  = 0.05

        // ── Texture ────────────────────────────────────────────────────
        // NOTE: flipY must stay TRUE (default) for PNG image textures.
        // Setting it to false inverts UVs and makes the texture invisible.
        this.model.texture = this.resources.items.resumeTexture
        this.model.texture.encoding  = THREE.sRGBEncoding
        // Do NOT set flipY = false here — PNG textures need the default flipY = true

        // ── Outer walnut frame ─────────────────────────────────────────
        const outerGeo = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth)
        const outerMat = new THREE.MeshBasicMaterial({ color: '#3b2010' })
        this.model.outerMesh = new THREE.Mesh(outerGeo, outerMat)
        this.model.group.add(this.model.outerMesh)
        this.clickables.push(this.model.outerMesh)

        // ── Cream inner matte ──────────────────────────────────────────
        const matW   = frameWidth  - borderSize * 2
        const matH   = frameHeight - borderSize * 2
        const matGeo = new THREE.BoxGeometry(matW, matH, frameDepth)
        const matMat = new THREE.MeshBasicMaterial({ color: '#f0eade' })
        this.model.matMesh = new THREE.Mesh(matGeo, matMat)
        this.model.matMesh.position.z = frameDepth * 0.2
        this.model.group.add(this.model.matMesh)
        this.clickables.push(this.model.matMesh)

        // ── Gold lip ───────────────────────────────────────────────────
        const lipInset = borderSize * 2.2
        const lipW     = frameWidth  - lipInset * 2
        const lipH     = frameHeight - lipInset * 2
        const lipGeo   = new THREE.BoxGeometry(lipW + 0.01, lipH + 0.01, frameDepth)
        const lipMat   = new THREE.MeshBasicMaterial({ color: '#c9a84c' })
        this.model.lipMesh = new THREE.Mesh(lipGeo, lipMat)
        this.model.lipMesh.position.z = frameDepth * 0.3
        this.model.group.add(this.model.lipMesh)
        this.clickables.push(this.model.lipMesh)

        // ── Resume paper (texture) ─────────────────────────────────────
        const paperInset = borderSize * 2.5
        const paperW     = frameWidth  - paperInset * 2
        const paperH     = frameHeight - paperInset * 2
        const paperGeo   = new THREE.PlaneGeometry(paperW, paperH)
        const paperMat   = new THREE.MeshBasicMaterial({ map: this.model.texture })
        this.model.paperMesh = new THREE.Mesh(paperGeo, paperMat)
        this.model.paperMesh.position.z = frameDepth * 0.5
        this.model.group.add(this.model.paperMesh)
        this.clickables.push(this.model.paperMesh)

        // ── Debug controls ─────────────────────────────────────────────
        if(this.debug)
        {
            const pos = this.model.group.position
            const rot = this.model.group.rotation
            this.debugFolder.addInput(pos, 'x', { label: 'posX', min: -5, max: 5, step: 0.001 })
            this.debugFolder.addInput(pos, 'y', { label: 'posY', min:  0, max: 7, step: 0.001 })
            this.debugFolder.addInput(pos, 'z', { label: 'posZ', min: -5, max: 5, step: 0.001 })
            this.debugFolder.addInput(rot, 'y', { label: 'rotY', min: -Math.PI, max: Math.PI, step: 0.001 })
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  Expand overlay — styled like a premium framed gallery piece
    // ─────────────────────────────────────────────────────────────────
    setModal()
    {
        const style = document.createElement('style')
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400&display=swap');

            /* ── Backdrop ── */
            #resume-overlay {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(10, 5, 2, 0.88);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            #resume-overlay.rf-open {
                display: flex;
            }
            #resume-overlay.rf-visible {
                opacity: 1;
            }

            /* ── Frame wrapper ── */
            #resume-frame-wrap {
                position: relative;
                /* Wood outer border */
                border: 14px solid #3b2010;
                border-radius: 4px;
                box-shadow:
                    0 0 0 3px #c9a84c,          /* gold lip */
                    0 0 0 5px #3b2010,           /* second wood ring */
                    0 40px 100px rgba(0,0,0,0.8);

                max-width: min(680px, 88vw);
                width: 100%;

                transform: scale(0.82) translateY(28px);
                transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            #resume-overlay.rf-visible #resume-frame-wrap {
                transform: scale(1) translateY(0);
            }

            /* ── Cream matte inner border ── */
            #resume-matte {
                background: #f5f0e8;
                padding: 20px;
                border-radius: 1px;
            }

            /* ── Resume image ── */
            #resume-matte img {
                display: block;
                width: 100%;
                height: auto;
                border-radius: 1px;
                box-shadow: 0 2px 16px rgba(0,0,0,0.18);
            }

            /* ── Close button ── */
            #rf-close {
                position: absolute;
                top: -18px;
                right: -18px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #3b2010;
                border: 2px solid #c9a84c;
                color: #c9a84c;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.25s, color 0.25s, transform 0.25s;
                font-family: 'Roboto', sans-serif;
                z-index: 1;
            }
            #rf-close:hover {
                background: #c9a84c;
                color: #3b2010;
                transform: rotate(90deg) scale(1.1);
            }

            /* ── Caption strip ── */
            #rf-caption {
                text-align: center;
                margin-top: 14px;
                font-family: 'Roboto', sans-serif;
                font-weight: 300;
                font-size: 12px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.35);
            }
        `
        document.head.appendChild(style)

        this.overlay = document.createElement('div')
        this.overlay.id = 'resume-overlay'
        this.overlay.innerHTML = `
            <div id="resume-frame-wrap">
                <button id="rf-close" title="Close (Esc)">✕</button>
                <div id="resume-matte">
                    <img src="/assets/resumeTexture.png" alt="My Resume" />
                </div>
            </div>
            <p id="rf-caption">Click outside or press Esc to close</p>
        `
        document.body.appendChild(this.overlay)

        // Close on backdrop
        this.overlay.addEventListener('click', (e) => {
            if(e.target === this.overlay || e.target.id === 'rf-caption') this.closeModal()
        })
        document.getElementById('rf-close').addEventListener('click', () => this.closeModal())
        document.addEventListener('keydown', (e) => { if(e.key === 'Escape') this.closeModal() })
    }

    openModal()
    {
        this.overlay.classList.add('rf-open')
        void this.overlay.offsetWidth          // force reflow
        this.overlay.classList.add('rf-visible')
    }

    closeModal()
    {
        this.overlay.classList.remove('rf-visible')
        setTimeout(() => this.overlay.classList.remove('rf-open'), 420)
    }

    // ─────────────────────────────────────────────────────────────────
    //  Raycaster — click detection
    // ─────────────────────────────────────────────────────────────────
    setClickHandler()
    {
        const canvas = this.experience.renderer.instance.domElement

        canvas.addEventListener('mousedown', (e) => {
            this.mouseDownPos = { x: e.clientX, y: e.clientY }
            this.isDragging   = false
        })

        canvas.addEventListener('mousemove', (e) => {
            const dx = e.clientX - this.mouseDownPos.x
            const dy = e.clientY - this.mouseDownPos.y
            if(Math.sqrt(dx * dx + dy * dy) > 5) this.isDragging = true

            // Pointer cursor on hover
            this.updateMouse(e)
            canvas.style.cursor = this.castRay().length > 0 ? 'pointer' : 'default'
        })

        canvas.addEventListener('mouseup', (e) => {
            if(this.isDragging) return
            this.updateMouse(e)
            if(this.castRay().length > 0) this.openModal()
        })
    }

    updateMouse(e)
    {
        const rect = this.experience.renderer.instance.domElement.getBoundingClientRect()
        this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
        this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
    }

    castRay()
    {
        this.raycaster.setFromCamera(this.mouse, this.camera.instance)
        return this.raycaster.intersectObjects(this.clickables)
    }
}
