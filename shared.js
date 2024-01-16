
function validIp(str) {
    if (str && typeof str==='string') {
        let splitted
        if (splitted=str.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/)) {
            for(let octet of splitted) {
                if (parseInt(octet)>=0 && parseInt(octet)<=255) continue
                return false
            }
            return true
        }
    }
    return false
}

function promiseTimeout(ms, promise) {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('TIMEDOUT')
        }, ms)
    })

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
        promise,
        timeout
    ])
}

module.exports = {
    promiseTimeout,
    validIp
}
