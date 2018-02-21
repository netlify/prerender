module.exports = {
  log() {
    console.log.apply(
      console.log,
      [new Date().toISOString()].concat(
        Array.prototype.slice.call(arguments, 0)
      )
    );
  }
};
