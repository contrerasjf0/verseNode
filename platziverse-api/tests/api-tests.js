import { type } from 'os';

'use strict'

const test = require('ava')
const util = require('util')
const request = require('supertest')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const config = require('../../config/configs')
const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')
const auth = require('../auth')
const sign = util.promisify(auth.sign)

let sandbox = null
let server = null
let dbStub = null
let token = null
let AgentStub = {}
let MetricStub = {}

let uuid = 'yyy-yyy-yyx'
let uuidNotExist = '43234'
let typeMetric = 'CPU'
let typeMetricNotExit = 'RAM'

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()

  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentStub,
    Metric: MetricStub
  }))

  AgentStub.findConnected = sandbox.stub()
  AgentStub.findConnected.returns(Promise.resolve(agentFixtures.connected))
  
  AgentStub.findByUuid = sandbox.stub()
  AgentStub.findByUuid.withArgs(uuid).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(uuid).returns(Promise.resolve(metricFixtures.byAgentUuid(uuid)))

  MetricStub.findByTypeAgentUuid  = sandbox.stub()
  MetricStub.findByTypeAgentUuid.withArgs(typeMetric, uuid).returns(Promise.resolve(metricFixtures.byTypeAgentUuid(typeMetric, uuid)))

  token =  await sign({admin:true, username: 'platzi', permissions: ['metrics:read']}, config.auth.secret)
  
  const api = proxyquire('../api', {
    'platziverse-db': dbStub
  })

  server = proxyquire('../server', {
    './api': api
  })
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test.serial.cb('/api/agents', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.connected)
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/agents -not autorization', t => {
  request(server)
    .get('/api/agents')
    .expect(500)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      t.deepEqual(body, '{"error":"No authorization token was found"}', 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid', t => {
    request(server)
        .get(`/api/agent/${uuid}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) =>{
            t.falsy(err, 'Should not return error')
            let body = JSON.stringify(res.body)
            let expected = JSON.stringify(agentFixtures.byUuid(uuid))
            t.deepEqual(body, expected, 'response body should be the expected')
            t.end()
        })
})

test.serial.cb('/api/agent/:uuid - not found',t => {
  

  request(server)
    .get(`/api/agent/${uuidNotExist}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'Should not return error')
      let body = JSON.stringify(res.body)
      t.deepEqual(body, '{"error":"Agent not found with uuid 43234"}', 'Should be return the value expected')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid', t => {
  request(server)
    .get(`/api/metrics/${uuid}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'Shoul not return error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.byAgentUuid(uuid))
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })

})

test.serial.cb('/api/metrics/:uuid - not found', t => {
  request(server)
    .get(`/api/metrics/${uuidNotExist}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'Shoul not return error')
      let body = JSON.stringify(res.body)
      t.deepEqual(body, `{"error":"Metrics not found for agent with uuid ${uuidNotExist}"}`, 'Should be return the value expected')
      t.end()
    })
})


test.serial.cb('/api/metrics/:uuid/:type', t => {
  request(server)
    .get(`/api/metrics/${uuid}/${typeMetric}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'Shoul not return error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.byTypeAgentUuid(typeMetric, uuid))
      console.log(body);
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })

})

test.serial.cb('/api/metrics/:uuid/:type - not found', t => {
  request(server)
    .get(`/api/metrics/${uuid}/${typeMetricNotExit}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'Shoul not return error')
      let body = JSON.stringify(res.body)
      t.deepEqual(body, `{"error":"Metrics (${typeMetricNotExit}) not found for agent with uuid ${uuid}"}`, 'Should be return the value expected')
      t.end()
    })
})

//todos

//test.serial.todo('/api/agent/:uuid')
//test.serial.todo('/api/agent/:uuid - not found')

//test.serial.todo('/api/metrics/:uuid')
//test.serial.todo('/api/metrics/:uuid - not found')

//test.serial.todo('/api/metrics/:uuid/:type')
//test.serial.todo('/api/metrics/:uuid/:type - not found')