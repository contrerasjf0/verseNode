'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const metricFixtures = require('./fixtures/metric')
const agentFixture = require('./fixtures/agent')

let AgentStub = {
  hasMany: sinon.spy()
}

let config = {
  logging: function () {}
}

let uuid = 'yyy-yyy-yyy'
let MetricStub = null
let db = null
let sandbox = null
let type = 'DDD'

let metric = {
  type: 'DD',
  value: 66
}

let uuidArgs = {
  where: {
    uuid
  }
}

let agentUuidArgs = {
  attributes: ['type'],
  group: [ 'type' ],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}

let typeUuidArgs = {
  attributes: [ 'id', 'type', 'value', 'createdAt' ],
  where: {
    type
  },
  limit: 20,
  order: [[ 'createdAt', 'DESC' ]],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}

test.beforeEach(async t => {
  sandbox = sinon.sandbox.create()

  MetricStub = {
    belongsTo: sinon.spy()
  }

  // modeles findAll stub
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs(agentUuidArgs).returns(Promise.resolve(metricFixtures.byAgentUuid(uuid)))
  MetricStub.findAll.withArgs(typeUuidArgs).returns(Promise.resolve(metricFixtures.byTypeAgentUuid(type, uuid)))

  // models findOne stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixture.byUuid(uuid)))

  // models create stub
  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(metric).returns(Promise.resolve({
    toJSON () { return metric }
  }))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test.serial('Setup metrics', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Arguments should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricStub.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test('Metric', t => {
  t.truthy(db.Metric, 'should be exist')
})

test.serial('Metric#findByAgentUuid', async t => {
  let metric = await db.Metric.findByAgentUuid(uuid)

  t.true(MetricStub.findAll.called, 'findAll was called')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called was once')
  t.true(MetricStub.findAll.calledWith(agentUuidArgs), 'findAll should be  called with agent uuid args')

  t.deepEqual(metric, metricFixtures.byAgentUuid(uuid))
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  let metric = await db.Metric.findByTypeAgentUuid(type, uuid)

  t.true(MetricStub.findAll.called, 'findAll was called')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called was once')
  t.true(MetricStub.findAll.calledWith(typeUuidArgs), 'findAll should be called with args typeUuid')

  t.deepEqual(metric, metricFixtures.byTypeAgentUuid(type, uuid))
})

test.serial('Metric#create', async t => {
  let newMetric = await db.Metric.create(uuid, metric)

  t.true(AgentStub.findOne.called, 'findOne of Agent should be called')
  t.true(AgentStub.findOne.calledOnce, 'findOne of Agent was called once')
  t.true(MetricStub.create.called, 'Create of Metric should be called')
  t.true(MetricStub.create.calledOnce, 'Creat of Metric should be called was once')
  t.true(MetricStub.create.calledWith(metric), 'Create of metric was called with args of metric')

  t.deepEqual(newMetric, metric)
})
