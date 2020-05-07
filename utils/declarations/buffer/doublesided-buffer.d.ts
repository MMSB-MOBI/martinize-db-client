/**
 * @file Double Sided Buffer
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @private
 */
import { Group, BufferGeometry, Mesh, LineSegments, Vector3, Matrix4 } from 'three';
import Buffer, { BufferSide } from './buffer';
import { Picker } from '../utils/picker';
/**
 * A double-sided mesh buffer. Takes a buffer and renders the front and
 * the back as seperate objects to avoid some artifacts when rendering
 * transparent meshes. Also allows to render the back of a mesh opaque
 * while the front is transparent.
 * @implements {Buffer}
 *
 * @example
 * var sphereGeometryBuffer = new SphereGeometryBuffer({
 *   position: new Float32Array([ 0, 0, 0 ]),
 *   color: new Float32Array([ 1, 0, 0 ]),
 *   radius: new Float32Array([ 1 ])
 * });
 * var doubleSidedBuffer = new DoubleSidedBuffer(sphereGeometryBuffer);
 */
declare class DoubleSidedBuffer {
    size: number;
    side: BufferSide;
    visible: boolean;
    wireframe: boolean;
    geometry: BufferGeometry;
    picking?: Picker;
    group: Group;
    wireframeGroup: Group;
    pickingGroup: Group;
    frontMeshes: (Mesh | LineSegments)[];
    backMeshes: (Mesh | LineSegments)[];
    buffer: Buffer;
    frontBuffer: Buffer;
    backBuffer: Buffer;
    /**
     * Create a double sided buffer
     * @param  {Buffer} buffer - the buffer to be rendered double-sided
     */
    constructor(buffer: Buffer);
    set matrix(m: Matrix4);
    get matrix(): Matrix4;
    get pickable(): boolean;
    get parameters(): {
        opaqueBack: boolean;
        side: BufferSide;
        opacity: number;
        depthWrite: boolean;
        clipNear: number;
        clipRadius: number;
        clipCenter: Vector3;
        flatShaded: boolean;
        wireframe: boolean;
        roughness: number;
        metalness: number;
        diffuse: number;
        diffuseInterior: boolean;
        useInteriorColor: boolean;
        interiorColor: number;
        interiorDarkening: number;
        forceTransparent: boolean;
        matrix: Matrix4;
        disablePicking: boolean;
        sortParticles: boolean;
        background: boolean;
    };
    getParameters(): {
        opaqueBack: boolean;
        side: BufferSide;
        opacity: number;
        depthWrite: boolean;
        clipNear: number;
        clipRadius: number;
        clipCenter: Vector3;
        flatShaded: boolean;
        wireframe: boolean;
        roughness: number;
        metalness: number;
        diffuse: number;
        diffuseInterior: boolean;
        useInteriorColor: boolean;
        interiorColor: number;
        interiorDarkening: number;
        forceTransparent: boolean;
        matrix: Matrix4;
        disablePicking: boolean;
        sortParticles: boolean;
        background: boolean;
    };
    getMesh(picking: boolean): Group;
    getWireframeMesh(): LineSegments;
    getPickingMesh(): Group;
    setAttributes(data: any): void;
    setParameters(data: any): void;
    setVisibility(value: boolean): void;
    dispose(): void;
    /**
     * Customize JSON serialization to avoid circular references.
     * Only export simple params which could be useful.
     */
    toJSON(): any;
}
export default DoubleSidedBuffer;
