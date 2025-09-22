import React, { useState, useEffect, useRef } from 'react';

import { Toast } from 'primereact/toast';
import { Tree } from 'primereact/tree';
import { ContextMenu } from 'primereact/contextmenu';
import { Button } from 'primereact/button';

import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { RadioButton } from 'primereact/radiobutton'
import { AutoComplete } from 'primereact/autocomplete'
import { Message } from 'primereact/message'

import NodeItem from './NodeItem'

import utils from './utils';
import service from '../service';
import helper from './helper';

import './style.scss'

const MAXLEN = 9;
const MAXLEVEL = 2;

const types = [
    {id: 'federation', desc: 'Незавершенные турниры федерации'},
    {id: 'league', desc: 'Незавершенные турниры лиги'},
    {id: 'tournament', desc: 'Турнир'},
    {id: 'group', desc: 'Группа турниров'},
];

const FedNav = ({ subject, tabmenuEdge }) => {
//console.log('FEDNAV', subject);

    const [nodes, setNodes] = useState([]);
    const [dbnav, setDbnav] = useState([]);

    const [expandedKeys, setExpandedKeys] = useState({});
    const [selectedNodeKey, setSelectedNodeKey] = useState(null);
    const [selectedNodeKeys1, setSelectedNodeKeys1] = useState(null);
    const [selectedNodeKeys2, setSelectedNodeKeys2] = useState(null);
    const [selectedNodeKeys3, setSelectedNodeKeys3] = useState(null);
    const [addedType, setAddedType] = useState(null);
    const [editNode, setEditNode] = useState(null);
    //const [hideMenu, setHideMenu] = useState(true)
    const [progress, setProgress] = useState(false);
    // const [lostLeagues, setLeagues] = useState([])
    // const [lostTourns, setTourns] = useState([])

    useEffect(() => {
        //const data = utils.getTreeNodes();
        //setNodes(data)
        getNav()
    }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const nav = helper.getNavFromNodes(nodes)
        //console.log('data nav', nav, 'nodes', nodes);
        setDbnav(nav)
    }, [nodes]);

    const toast = useRef(null);
    const toastTC = useRef(null);

    const cm = useRef(null);

    const saveNav = async () => {
        setProgress(true)
        const nav = helper.getNavFromNodes(nodes)
        //console.log('saveNav', nav);
        const resp = await service.postNav(nav, toast)
        setProgress(false)
    }

    const getNav = async () => {
        setProgress(true)
        const data = await service.getNav();
        //console.log('data', data);
        if (data && data.length) {
            const mapd = helper.getNodesFromNav(data)
            //console.log('data getNav', mapd);
            // if (subject) {
            //     setLeagues(subject.leagues.filter(l => !data.find(n => n.type === 'league' && n._id === l._id)))
            //     setTourns(subject.tournaments.filter(t => !data.find(n => n.type === 'tournament' && n._id === t._id)))
            // }
            setDbnav(data)
            setNodes(mapd)
            const mapd2 = helper.getNavFromNodes(mapd)
            //console.log('data mapd2', mapd2);
        }
        setProgress(false)
    }

    const menu = [
        /*{
            label: 'View Key',
            icon: 'pi pi-search',
            command: () => {
                toast.current.show({ severity: 'success', summary: 'Node Key', detail: selectedNodeKey });
            }
        },
        {
            label: 'Toggle',
            icon: 'pi pi-sort',
            command: () => {
                let _expandedKeys = { ...expandedKeys };
                //console.log('selectedNodeKey', selectedNodeKey, '_expandedKeys', _expandedKeys);
                if (_expandedKeys[selectedNodeKey]) {
                    delete _expandedKeys[selectedNodeKey]
                } else {
                     _expandedKeys[selectedNodeKey] = true;
                }
                //console.log('_expandedKeys after', _expandedKeys);

                setExpandedKeys(_expandedKeys);
            }
        },*/
        {
            label: 'Редактировать',
            icon: 'pi pi-pencil',
            command: () => {
                //console.log('selectedNodeKey', selectedNodeKey);
                editingNode(selectedNodeKey)
            }
        },
        {
            label: 'Добавить',
            icon: 'pi pi-plus',
            command: () => {
                //console.log('selectedNodeKey', selectedNodeKey);
                //addNode(selectedNodeKey)
                setEditNode({key: selectedNodeKey})
            }
        },
        {
            label: 'Удалить',
            icon: 'pi pi-times',
            command: () => {
                //console.log('selectedNodeKey', selectedNodeKey);
                removeNode(selectedNodeKey)
            }
        }
    ];

    /*const expandAll = () => {
        let _expandedKeys = {};
        for (let node of nodes) {
            expandNode(node, _expandedKeys);
        }

        setExpandedKeys(_expandedKeys);
    }

    const collapseAll = () => {
        setExpandedKeys({});
    }*/

    /*const nodeTemplate = node => {
        return  <div className={`p-treenode ${node.children ? 'p-treenode-leaf' : ''}`}>
                    <Button type="button" icon="p-tree-toggler-icon pi pi-fw pi-chevron-right" className="p-tree-toggler p-link" />
                    <span className={`p-treenode-icon pi pi-fw ${node.icon}`}></span>
                    <span className='p-treenode-label'>{node.label}</span>
                    <i className='pi pi-cog editNodeBtn' onClick={(e) => cm.current.show(e.originalEvent)}></i>
                </div>
            }
            */
    const nodeTemplate = node => {
        return  [
            //<i className='pi pi-arrows-alt' style={{display: 'inline-block', width: '16px', height: '16px'}}></i>,
            <i className='pi pi-arrows-v' style={{display: 'inline-block', width: '16px', height: '16px', opacity: 0.5, marginRight: '5px'}}></i>,
            <span className='p-treenode-label'>{node.label}</span>,
            <i className='pi pi-ellipsis-v editNodeBtn' onClick={(e) => {
                //console.log('click', e, node);
                //setHideMenu(!hideMenu)
                //e.isPropagationStopped(true);
                //setEditDialog(node);
                setSelectedNodeKey(node.key)
                cm.current.show(e)
            }}></i>
        ]
    }
    const expandNode = (node, _expandedKeys) => {
        if (node.children && node.children.length) {
            _expandedKeys[node.key] = true;

            for (let child of node.children) {
                expandNode(child, _expandedKeys);
            }
        }
    }

    const addNode = (nodeKey, newNode) => {
        //console.log('addNode', nodeKey);
        changeNodes(nodeKey, 'add', newNode)
    }

    const removeNode = (nodeKey) => {
        changeNodes(nodeKey, 'edit', null)
    }

    const editingNode = (nodeKey, changedNode) => {
        //console.log('nodeKey', nodeKey);

        const splitNodeKey = nodeKey.length ? nodeKey.split('-').map(i => +i) : [nodeKey];

        let node = nodes[splitNodeKey[0]]
        let edNode = getNodeBykey(nodeKey);
        //console.log('rename grand node', node, 'edNode before', edNode, 'nodeKey', splitNodeKey);
        // const newLabel = 'Success Edited'
        // const editedNode = changedNode || {...edNode, label: newLabel};
        // changeNodes(nodeKey, 'edit', editedNode)
        setEditNode(edNode)
    }

    const changeNodes = (nodeKey, action='edit', editedNode) => {
        //console.log('changeNodes', nodeKey, action, editedNode);
        const splitNodeKey = nodeKey.length ? nodeKey.split('-').map(i => +i) : [nodeKey];

        let node = nodes[splitNodeKey[0]]

        //console.log( 'editedNode', editedNode, action);

        const mapd = (action === 'add' && splitNodeKey.length === 1) ? [...nodes, {...editedNode, key: nodes.length}] : nodes.map((n, i) => {
            if (i === splitNodeKey[0]) {
                //console.log('splitNodeKey[1]', splitNodeKey[1], splitNodeKey[2]);
                if (splitNodeKey[1] !== undefined) {
                    const maped = action === 'add' ? [...n.children, {...editedNode, key: `${n.children.length}`}] : n.children.map((c, j) => {
                        //console.log('j', j, 'splitNodeKey', splitNodeKey[1], j === splitNodeKey[1]);
                        if (j === splitNodeKey[1]) {
                            //console.log(splitNodeKey[2] === undefined, 'editedNode', editedNode );

                            if (splitNodeKey[2] !== undefined) {
                                const mapedd = action === 'add' ? [...c.children, {...editedNode, key: `${c.children.length}`}] : c.children.map((gr, k) => {
                                    if (k === splitNodeKey[2]) {
                                        return editedNode
                                    } else {
                                        return gr
                                    }
                                })
                                return {...c, children: mapedd.filter(n => !!n)}
                            } else {
                                return editedNode
                            }
                        } else {
                            return c
                        }
                    })
                    //console.log('mapd', maped);
                    return {...n, children: maped.filter(n => !!n)}
                } else {
                    return editedNode
                }
            } else {
                return n
            }
        }).filter(n => !!n)
        const resMapd = editedNode ? mapd : mapd.map((n, i) => {
            //console.log(i, n.key, i === +n.key );
            if (i === +n.key) {
                return n
            } else {
                return {
                    ...n,
                    key: i,
                    children: n.children ? n.children.map((c, j) => {
                        //console.log('j', j, 'splitNodeKey', splitNodeKey[1], j === splitNodeKey[1]);
                        if (`${i}-${j}` === c.key) {
                            return c
                        } else {
                            return {
                                ...c,
                                key: `${i}-${j}`,
                                children: c.children ? c.children.map((d, k) => {
                                    if (`${i}-${j}-${k}` === d.key) {
                                        return d
                                    } else {
                                        return {
                                            ...d,
                                            key: `${i}-${j}`,
                                        }
                                    }
                                }) : []
                            }
                        }
                    }) : []
                }
            }
        })
        //console.log('mapd', mapd, resMapd);

        setNodes(resMapd)
        setEditNode(null)
    }

    const getNodeBykey = nodeKey => {
        const splitNodeKey = nodeKey.length ? nodeKey.split('-') : [nodeKey]

        //console.log('rename', nodeKey, splitNodeKey, 'length', splitNodeKey.length, splitNodeKey.slice(0, 3));
        // const [nodes, setNodes] = useState(null);
        // const [dbnav, setDbnav] = useState([]);
        let node = nodes[splitNodeKey[0]]
        let editedNode;

        if (splitNodeKey[1] && node.children && node.children.length ) {
            const child = node.children.find(c => c.key === nodeKey.slice(0,3))
            //console.log('child', nodeKey.slice(0,3), child);
            if (splitNodeKey[2] && child && child.children && child.children.length ) {
                const grandchild = child.children.find(c => c.key === nodeKey.slice(0,5))
                //console.log('grandchild', nodeKey.slice(0,5), grandchild);
                editedNode = grandchild
            }
            if (!editedNode) {
                editedNode = child
            }
        }
        if (!editedNode) {
            editedNode = node
        }
        //console.log('getNodeBykey', editedNode);
        return editedNode
    }

    // const toggleMovies = () => {
    //         let expanded = {...expandedKeys};
    //         if (expanded['4'])
    //             delete expanded['4'];
    //         else
    //             expanded['4'] = true;
    //         //style={{paddingLeft: '20px', overflow: 'scroll', height: '700px'}}
    //         //style={{paddingLeft: '20px', overflow: 'scroll'}}
    //         setExpandedKeys(expanded);
    //     }
/*
<Menu model={items} popup ref={menu} id="popup_menu" onHide={(e) => e.stopPropagation()}/>
<Button
    icon="pi pi-ellipsis-v"
    className={'menu-button'}
    onClick={(e) => {
        e.stopPropagation()
        setActivePub(pub)
        menu.current.toggle(e)
    }}
    aria-controls="popup_menu" aria-haspopup
/>
*/
//console.log('nodes', nodes.length, menu.filter(m => m.label !== 'Добавить'), 'selectedNodeKey', selectedNodeKey, !selectedNodeKey.length, !!(nodes && nodes.length && nodes.length >= MAXLEN && selectedNodeKey !== null && !selectedNodeKey.length));
    return nodes.length ? (
        <div className={'appearance-nav'} >
            <Toast ref={toast} />
            <Toast ref={toastTC} position="top-center" />
            {/*<h5>Single Selection</h5>*/}
            <ContextMenu
                model={!!(nodes && nodes.length && nodes.length >= MAXLEN && selectedNodeKey !== null && !selectedNodeKey.length) ? menu.filter(m => m.label !== 'Добавить') : menu}
                ref={cm}
                //hide={hideMenu}
            />

            <div className="appearance-card">
                <div className={'appearance-actions'}>
                    <Button
                        className='p-button-sm p-button-success'
                        icon={`pi pi-${progress ? 'spinner pi-check' : 'check'}`}
                        disabled={progress}
                        onClick={() => saveNav()}
                        label='Сохранить'
                    />
                    <Button
                        className='p-button-sm'
                        icon={`pi pi-chevron-down`}
                        iconPos='right'
                        disabled={progress}
                        onClick={() => {
                            if (nodes.length && nodes.length >= MAXLEN) {
                                toastTC.current.show({severity: 'info', summary: 'Нельзя добавить', detail: 'У навигации не может быть более '+MAXLEN+' пунктов верхнего уровня. Переместите или удалите один', position:"top-center", life: 2000})
                            } else {
                                setEditNode({key: nodes.length})
                            }
                        }}
                        label='Добавить'
                    />
                </div>
                <Tree
                    style={{maxHeight: `calc(100vh - ${tabmenuEdge}px - 40px)`, overflowY: 'auto'}}
                    value={nodes}
                    expandedKeys={expandedKeys}
                    onToggle={(e) => setExpandedKeys(e.value)}
                    contextMenuSelectionKey={selectedNodeKey}
                    onContextMenuSelectionChange={(e) => setSelectedNodeKey(e.value)}
                    onContextMenu={(e) => cm.current.show(e.originalEvent)}
                    className="w-full md:w-30rem"
                    dragdropScope="demo"
                    onDragDrop={e => setNodes(e.value)}
                    nodeTemplate={nodeTemplate}
                />
            </div>
             {/*<Tree
                 value={nodes}
                 dragdropScope="demo"
                 onDragDrop={event => setNodes(event.value)}
             />*/}

            {editNode ? (
                <NodeItem
                    subject={subject}
                    nodeData={editNode}
                    nodekey={editNode.key}
                    changeNodes={changeNodes}
                    closeNode={() => setEditNode(null)}
                    removeNode={removeNode}
                    lostTourns={subject.tournaments.filter(t => editNode.key.length && nodes[editNode.key[0]].children ? !nodes[editNode.key[0]].children.find(n => n.type === 'tournament' && n.nodeId === t._id): !nodes.find(n => n.type === 'tournament' && n.nodeId === t._id))}
                    lostLeagues={subject.leagues.filter(l => !nodes.find(n => n.type === 'league' && n.nodeId === l._id))}
                    //addNode={addNode}
                    // if (subject) {
                    //     setLeagues(subject.leagues.filter(l => !data.find(n => n.type === 'league' && n._id === l._id)))
                    //     setTourns(subject.tournaments.filter(t => !data.find(n => n.type === 'tournament' && n._id === t._id)))
                    //
                />
                //subject, nodeData, key, changeNodes, closeNode, removeNode
            ): null}
        </div>
    ) : <div className="card" >
            <Button
                className='p-button-sm'
                icon={`pi pi-${progress ? 'spinner pi-plus' : 'plus'}`}
                disabled={progress}
                onClick={() => setEditNode({key: 0})}
                label='Создать меню'
            />
            {editNode ? (
                <NodeItem
                    subject={subject}
                    nodeData={editNode}
                    nodekey={editNode.key}
                    changeNodes={changeNodes}
                    closeNode={() => setEditNode(null)}
                    removeNode={removeNode}
                    addedType={addedType}
                    lostTourns={subject.tournaments.filter(t => !nodes.find(n => n.type === 'tournament' && n.nodeId === t._id))}
                    lostLeagues={subject.leagues.filter(l => !nodes.find(n => n.type === 'league' && n.nodeId === l._id))}

                />
            ): null}
        </div>
}
export default FedNav
