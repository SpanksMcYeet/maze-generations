// CREDIT: https://gist.github.com/blixt/f17b47c62508be59987b
export const Seed = class {
  constructor(seed) {
    this.seed = seed % 2147483647
    if (this.seed <= 0) 
      this.seed += 2147483646
  }
  next() {
    return this.seed = this.seed * 16807 % 2147483647
  }
  nextFloat(opt_minOrMax, opt_max) {
    return (this.next() - 1) / 2147483646
  }
}

// CREDIT: https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
export const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909)
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909)
    return 4294967296 * (2097151 & h2) + (h1>>>0)
}
