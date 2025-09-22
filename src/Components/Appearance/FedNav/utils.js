import treetablenodes from './treetablenodes.json';
import treenodes from './treenodes.json';

const utils = {}

utils.getTreeTableNodes = () => {
    // return fetch('./treetablenodes.json').then(res => res.json())
    //         .then(d => d.root);
    //console.log('treetablenodes', treetablenodes);
    return treetablenodes.root
}

utils.getTreeNodes = () => {
    // return fetch('./treenodes.json').then(res => res.json())
    //         .then(d => d.root);
    console.log('treenodes', treenodes);
    return treenodes.root
}
export default utils
