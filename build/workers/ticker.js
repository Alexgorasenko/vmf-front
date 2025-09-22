const appTicker = setInterval(() => {
    self.postMessage({action: 'tick'})
}, 1000)
