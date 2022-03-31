const express = require('express')
const Redis = require('ioredis')
const JSON = require('json-bigint')({ storeAsString: true })

const port = process.env.PORT || 3000
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0'
const secret = process.env.SECRET || 'superscarysecret'

const app = express()
const redisClient = new Redis(redisUrl)

app.set('json spaces', 2)

redisClient.on('error', (err) => console.log('Redis client error:', err))
redisClient.on('connect', () => console.log('Connected to Redis!'))

app.get('/teapot', (req, res) => {
  res.status(418).json({ code: 418, message: "I'm a teapot." })
})

app.use((req, res, next) => {
  if (req.headers.authorization !== secret && req.query.secret !== secret) {
    res.status(401).json({ code: 401, error: 'Unauthorized.' })
    return
  }
  next()
})

app.get('/', (req, res) => {
  res.status(403).json({
    code: 403,
    message: 'GET / is not allowed.'
  })
})

app.get('/:key', async (req, res) => {
  const keyType = await redisClient.type(req.params.key)
  let redisResp = null

  switch (keyType) {
    case 'none':
      res.status(404).json({
        code: 404,
        message: 'Key does not exist or is null.'
      })
      return

    case 'hash':
      redisResp = await redisClient.hgetall(req.params.key)
      Object.keys(redisResp).forEach(key => {
        try {
          const jsonResp = JSON.parse(redisResp[key])
          redisResp[key] = jsonResp
        } catch {} // leave as-is
      })
      break
    case 'list':
      redisResp = await redisClient.lrange(req.params.key, 0, -1)
      redisResp.forEach((value, index) => {
        try {
          const jsonResp = JSON.parse(value)
          redisResp[index] = jsonResp
        } catch {} // leave as-is
      })
      break
    case 'string':
      redisResp = await redisClient.get(req.params.key)
      try {
        redisResp = JSON.parse(redisResp)
      } catch {} // leave as-is
      break
    case 'set':
      redisResp = await redisClient.smembers(req.params.key)
      redisResp.forEach((value, index) => {
        try {
          const jsonResp = JSON.parse(value)
          redisResp[index] = jsonResp
        } catch {} // leave as-is
      })
      break
    default:
      res.status(501).json({
        status: 501,
        message: 'Support for this key type has not been implemented.',
        keyType: keyType
      })
      break
  }

  if (typeof redisResp === 'string') {
    try {
      const jsonResp = JSON.parse(redisResp)
      res.json({
        code: 200,
        data: jsonResp
      })
      return
    } catch {} // do nothing
  }

  res.json({
    code: 200,
    data: redisResp
  })
})

app.get('/:key/:value', async (req, res) => {
  const keyType = await redisClient.type(req.params.key)

  if (keyType !== 'hash' && keyType !== 'set') {
    res.status(400).json({
      code: 400,
      message: 'Bad request, key is not a hash or set and cannot be accessed like one. Try /:key.'
    })
    return
  }

  if (keyType === 'set') {
    const memberExists = Boolean(await redisClient.sismember(req.params.key, req.params.value))

    if (memberExists) {
      res.json({
        code: 200,
        memberExists: memberExists,
        data: req.params.value
      })
    } else {
      res.status(404).json({
        code: 404,
        memberExists: memberExists,
        message: 'Member does not exist in the set.'
      })
    }
    return
  }

  const redisResp = await redisClient.hget(req.params.key, req.params.value)

  if (redisResp) {
    try {
      const jsonResp = JSON.parse(redisResp)
      res.json({
        code: 200,
        data: jsonResp
      })
    } catch {
      res.json({
        code: 200,
        data: redisResp
      })
    }
  } else {
    res.status(404).json({
      code: 404,
      message: 'Key/value pair does not exist or is null.'
    })
  }
})

app.get('*', (req, res) => {
  res.status(404).json({ code: 404, message: 'Path has no handler.' })
})

app.all('*', (req, res) => {
  res.status(405).json({ code: 405, message: 'Method not allowed.' })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
