/**
 * @file Parser Loader
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @private
 */
import Loader from './loader';
import { LoaderParameters, LoaderInput } from './loader-utils';
export interface ParserParams {
    voxelSize?: number;
    firstModelOnly?: boolean;
    asTrajectory?: boolean;
    cAlphaOnly?: boolean;
    name?: string;
    path?: string;
}
/**
 * Parser loader class
 * @extends Loader
 */
declare class ParserLoader extends Loader {
    parserParams: ParserParams;
    constructor(src: LoaderInput, params?: Partial<LoaderParameters> & ParserParams);
    /**
     * Load parsed object
     * @return {Promise} resolves to the loaded & parsed {@link Structure},
     *                   {@link Volume}, {@link Surface} or data object
     */
    load(): any;
}
export default ParserLoader;
