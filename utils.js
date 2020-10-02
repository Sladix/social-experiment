function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

function computeLevel(xp,threshold){
  return Math.floor((1 + Math.sqrt(1+8*xp/threshold))/2);
}

exports.shuffle = shuffle;
exports.computeLevel = computeLevel;