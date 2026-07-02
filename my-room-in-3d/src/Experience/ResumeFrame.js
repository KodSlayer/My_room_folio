import * as THREE from 'three'
import Experience from './Experience.js'

export default class ResumeFrame
{
    constructor()
    {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.scene = this.experience.scene

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder({
                title: 'resumeFrame',
                expanded: true
            })
        }

        this.setModel()
    }

    setModel()
    {
        this.model = {}

        // ── Group ───────────────────────────────────────────────────────
        this.model.group = new THREE.Group()

        // Confirmed correct position via live debug panel:
        // The pink TV wall is at high positive X in this scene's coordinate system.
        // The frame is rotated PI/2 so its face points toward -X (into the room / toward the camera).
        this.model.group.position.set(3.95, 3.2, 1.8)
        this.model.group.rotation.y = Math.PI * 0.5

        this.scene.add(this.model.group)

        // ── Sizes ───────────────────────────────────────────────────────
        const frameWidth  = 0.55
        const frameHeight = 0.78
        const frameDepth  = 0.03
        const borderSize  = 0.04

        // ── Resume Texture ──────────────────────────────────────────────
        this.model.texture = this.resources.items.resumeTexture
        this.model.texture.encoding = THREE.sRGBEncoding
        this.model.texture.flipY = false

        // ── Outer frame (dark walnut) — MeshBasicMaterial so it's visible without lights ──
        const outerGeo = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth)
        const outerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#3b2010') })
        this.model.outerMesh = new THREE.Mesh(outerGeo, outerMat)
        this.model.group.add(this.model.outerMesh)

        // ── Cream matte inner border ────────────────────────────────────
        const matW = frameWidth  - borderSize * 2
        const matH = frameHeight - borderSize * 2
        const matGeo = new THREE.BoxGeometry(matW, matH, frameDepth * 0.5)
        const matMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f0eade') })
        this.model.matMesh = new THREE.Mesh(matGeo, matMat)
        this.model.matMesh.position.z = frameDepth * 0.26
        this.model.group.add(this.model.matMesh)

        // ── Gold inner lip ──────────────────────────────────────────────
        const lipInset = borderSize * 2.4
        const lipW = frameWidth  - lipInset * 2
        const lipH = frameHeight - lipInset * 2
        const lipGeo = new THREE.BoxGeometry(lipW + 0.01, lipH + 0.01, frameDepth * 0.2)
        const lipMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#c9a84c') })
        this.model.lipMesh = new THREE.Mesh(lipGeo, lipMat)
        this.model.lipMesh.position.z = frameDepth * 0.38
        this.model.group.add(this.model.lipMesh)

        // ── Resume paper ────────────────────────────────────────────────
        const paperInset = borderSize * 2.6
        const paperW = frameWidth  - paperInset * 2
        const paperH = frameHeight - paperInset * 2
        const paperGeo = new THREE.PlaneGeometry(paperW, paperH)
        const paperMat = new THREE.MeshBasicMaterial({ map: this.model.texture })
        this.model.paperMesh = new THREE.Mesh(paperGeo, paperMat)
        this.model.paperMesh.position.z = frameDepth * 0.52
        this.model.group.add(this.model.paperMesh)

        // ── Hanging wire ────────────────────────────────────────────────
        const wireGeo = new THREE.BoxGeometry(0.003, 0.12, 0.003)
        const wireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#888888') })
        this.model.wireMesh = new THREE.Mesh(wireGeo, wireMat)
        this.model.wireMesh.position.set(0, frameHeight * 0.5 + 0.06, 0)
        this.model.group.add(this.model.wireMesh)

        // ── Debug controls ──────────────────────────────────────────────
        if(this.debug)
        {
            const pos = this.model.group.position
            const rot = this.model.group.rotation

            this.debugFolder.addInput(pos, 'x', { label: 'posX', min: -5, max: 5, step: 0.001 })
            this.debugFolder.addInput(pos, 'y', { label: 'posY', min:  0, max: 6, step: 0.001 })
            this.debugFolder.addInput(pos, 'z', { label: 'posZ', min: -5, max: 5, step: 0.001 })
            this.debugFolder.addInput(rot, 'y', { label: 'rotY', min: -Math.PI, max: Math.PI, step: 0.001 })
        }
    }
}
