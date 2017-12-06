'use strict'
const agentFixture = require('./agent')
const util = require('../../../platziverse-db/utils')

const metric = {
  id: 1,
  agentId: agentFixture.single.uuid,
  type: 'DD',
  value: 30,
  createdAt: new Date(),
  updateAt: new Date()
}

const metrics = [
  metric,
  util.extend(metric, {id: 2, agentId: agentFixture.single.uuid, value: 25}),
  util.extend(metric, {id: 3, agentId: agentFixture.single.uuid, value: 33}),
  util.extend(metric, {id: 4, agentId: agentFixture.all[2].uuid, type: 'CPU', value: 23}),
  util.extend(metric, {id: 5, agentId: agentFixture.all[2].uuid, type: 'CPU', value: 22}),
  util.extend(metric, {id: 6, agentId: agentFixture.all[3].uuid, type: 'GPU', value: 99}),
  util.extend(metric, {id: 7, agentId: agentFixture.all[3].uuid, type: 'GPU', value: 88})
]

module.exports = {
  single: metric,
  all: metrics,
  byId: id => metric.filter(m => m.id === id).shift(),
  byAgentUuid: uuid => metrics.filter(m => m.agentId === uuid),
  byTypeAgentUuid: (type, uuid) => metrics.filter(m => (m.type === type) && (m.agentId === uuid)).sort(util.sorthDesc)

}
