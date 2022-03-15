# Redis data exposer

This was created for [Cliptok](https://github.com/Erisa/Cliptok) and not intended for use outside of it.
Use at your own peril.

This application will serve an API that will return read-only data from your configured Redis server.

## Disclaimer

The code here is not the best code it could have been. I am not overly proficient with JavaScript and this code was written to serve a single purpose. Please be gentle.

If you use this for some reason and have an issue, please report it.

## Setup

Environment variables (none are required):
- `PORT`: The port to listen on. Default is `3000`.
- `REDIS_URL`: URL pointing to the redis server to connect to. Default is localhost.
- `SECRET`: The secret to pass for authorization. Default is `superscarysecret`.

## Usage

Required: `Authorization` header or `secret` query parameter with the correct value.

### `GET /:key`

If `key` held `value`, you would get something like: 
```json
{
    "code": 200,
    "data": "value"
}
```

If the value is JSON, it will be parsed.
For example if `key` held `{"thing": "otherthing"}` you would get:
```json
{
    "code": 200,
    "data": {
        "thing": "otherthing"
    }
}
```

Big numbers will be converted to strings. Or maybe it was all numbers, I don't remember.

If the key is a list, it will be returned as such:
```json
{
    "code": 200,
    "data": [
        "thing",
        "otherthing"
    ]
}
```

You can also put JSON inside a list item, if you want.

If the value is a hash, it will return all items, same as JSON:
```json
{
    "code": 200,
    "data": [
        "thing",
        "otherthing"
    ]
}
```

### `GET /:key/:value`

If the key is not a hash, you get yelled at:

```json
{
  "code": 400,
  "message": "Bad request, key is not a hash and cannot be accessed like a hash. Try /:key."
}
```

If the value does not exist, you also get yelled at:
```json
{
  "code": "404",
  "message": "Key/value pair does not exist or is null."
}
```

But if it does exist, you get data:
```json
{
    "code": 200,
    "data": "thing in a hash"
}
```

## The end

That's it. There's nothing more to tell.