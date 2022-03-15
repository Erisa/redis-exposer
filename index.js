const express = require('express')
const JSON = require('json-bigint')({ storeAsString: true });
const app = express()
const port = process.env.PORT || 3000;
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0'
const secret = process.env.SECRET || "superscarysecret"

const redis = require('redis');

const redisClient = redis.createClient({
    url: redisUrl
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.on('connect', function() {
    console.log('Connected to redis!');
});

redisClient.connect();

app.get("/teapot", async (req, res) => {
    res.status(418).json({code: 418, message: "I'm a teapot."})
})

app.use(function(req, res, next) {
    console.log(req.query)
    if (req.headers.authorization != secret && req.query.secret != secret) {
        return res.status(401).json({ code: 401, error: 'Unauthorized.' });
    }
    next();
});

app.set('json spaces', 2)

app.get("/", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(403).json({
        code: 403,
        message: "GET / is not allowed."
    })
})

app.get("/:key", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const keyType = await redisClient.type(req.params.key)
    console.log(keyType)
    let redisResp = null
    if (keyType === "hash"){
        redisResp = await redisClient.hGetAll(req.params.key)
        
        for (let key in redisResp){
            try {
                jsonResp = JSON.parse(redisResp[key])
                redisResp[key] = jsonResp
            } catch(e) {
                // do nothing
            }
        }
    }
    else if (keyType == "none"){
        res.status(404).json({
            code: 404,
            message: "Key does not exist or is null."
        })
        return
    }
    else if (keyType == "list"){
        redisResp = await redisClient.lRange(req.params.key, 0, -1)

        redisResp.forEach(function(value, index){
            try {
                jsonResp = JSON.parse(value)
                redisResp[index] = jsonResp
            } catch {
                // leave as-is
            }
        })
    }
    else {
        redisResp = await redisClient.hGetAll(req.params.key)    
    }

    try {
        jsonResp = JSON.parse(redisResp)
        res.json({
            code: 200,
            data: jsonResp
        })
    } catch(e) {
        res.json({
            code: 200,
            data: redisResp
        })
    }
})

app.get('/:key/:value', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const keyType = await redisClient.type(req.params.key)
    
    if (keyType != "hash"){
        res.status(400).json({
            code: 400,
            message: "Bad request, key is not a hash and cannot be accessed like a hash. Try /:key."
        })
        return
    }

    const redisResp = await redisClient.hGet(req.params.key, req.params.value)

    if (redisResp){
        try {
            jsonResp = JSON.parse(redisResp);
            res.json({
                "code": 200,
                "data": jsonResp
            })        
        } catch(e) {
            res.json({
                "code": "200",
                "data": redisResp
            })
        }
    } else {
        res.status(404).json({
            "code": "404",
            "message": "Key/value pair does not exist or is null."
        })
    }
})

app.get('*', function(req, res){
    res.status(404).json({code: 404, message: "Path has no handler."});
});

app.all('*', function(req, res){
    res.status(405).json({code: 404, message: "Method not allowed."});
});
  

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
