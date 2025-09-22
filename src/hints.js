const options = [
    'matchedit_squad_hotkeys',
    'matchedit_roster_hotkeys'
]

const read = () => {
    const src = localStorage.getItem('_amateum_hints')
    return src ? JSON.parse(src) : {}
}

const write = obj => {
    localStorage.setItem('_amateum_hints', JSON.stringify(obj))
}

const initHints = () => {
    const obj = read()

    for(let opt of options) {
        if(typeof(obj[opt]) === 'undefined') {
            obj[opt] = true
        }
    }

    write({...obj})
}

const showHint = key => {
    const obj = read()
    return obj[key] === true
}

const suppressHint = (key, ref) => {
    const obj = read()
    write({
        ...obj,
        [key]: false
    })

    if(ref && ref.current) {
        try {
            ref.current.innerHTML = ''
        } catch(e) {
            console.log('Node delete failed')
        }
    }
}

export { initHints, showHint, suppressHint }
