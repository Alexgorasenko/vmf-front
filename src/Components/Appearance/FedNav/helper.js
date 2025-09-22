const helper = {}

helper.icons = {
    tournament:  'pi pi-fw pi-shield',
    group: 'pi pi-fw pi-folder',
    group_open: 'pi pi-fw pi-folder-open',
    league: 'pi pi-fw pi-flag-fill',
    league_open: 'pi pi-fw pi-flag',
    federation: 'pi pi-fw pi-star',
    federation_open: 'pi pi-fw pi-star-fill'
}

helper.nodeView = (nav, key) => {
    const { name, type, _id } = nav;
    return {
        "key": key,
        'nodeId': _id || null,
        "label": name || '',
        "data": name || '',
        type: type,
        "icon": helper.icons[type]
    }
}

helper.navView = (node) => {
    const { nodeId, label, type } = node;
    return nodeId ? {
        _id: nodeId,
        name: label,
        type: type,
    } : {
        name: label,
        type: 'group'
    }
}
helper.getNodesFromNav = navs => {
    if (navs && navs.length) {
        const mapd = navs.map((n, ind) => {
            const { name, type, children, _id: nodeId } = n;

            const node = helper.nodeView(n, ind)
            const childs = children && children.length ? children.map((n, i) => helper.nodeView(n, `${ind}-${i}`)) : null
            return childs ? {...node, children: childs} : node
        })

        return mapd
    } else {
        return null
    }
}

helper.getNavFromNodes = (nodes) => {
    if (nodes && nodes.length) {

        const mapd = nodes.map((n, ind) => {
            const { name, type, children, _id: nodeId } = n;

            const nav = helper.navView(n)
            const childs = children && children.length ? children.map((n, i) => helper.navView(n)) : null
            return childs ? {...nav, children: childs} : nav
        })

        return mapd
    } else {
        return null
    }
}

export default helper
