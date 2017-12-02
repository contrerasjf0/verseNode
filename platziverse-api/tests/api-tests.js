'use strict'

const test = require('ava')
const util = require('util')
const request = require('supertest')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const config = require('../../config/configs')
const agentFixtures = require('./fixtures/agent')
const auth = require('../auth')
const sign = util.promisify(auth.sign)

let sandbox = null
let server = null
let dbStub = null
let token = null
let AgentStub = {}
let MetricStub = {}

let uuid = 'yyy-yyy-yyx'

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

  token =  await sign({admin:true, username: 'platzi'}, config.auth.secret)
  
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
  let uuidNotExist = '43234'

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
//test.serial.todo('/api/agent/:uuid')
//test.serial.todo('/api/agent/:uuid - not found')

test.serial.todo('/api/metrics/:uuid')
test.serial.todo('/api/metrics/:uuid - not found')

test.serial.todo('/api/metrics/:uuid/:type')
test.serial.todo('/api/metrics/:uuid/:type - not found')