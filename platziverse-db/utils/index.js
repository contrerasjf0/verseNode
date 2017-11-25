'use strict'

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

function sorthDesc (a, b) {
  return new Date(b.date) - new Date(a.date)
}
module.exports = {
  extend,
  sorthDesc
}
