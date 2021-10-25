# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

## Test Suite

There are currently 2 test apps:

**[Dummy App](https://github.com/kurierjs/kurier/tree/main/tests/dummy-app)** is a sort of playground to play and break stuff.

**[Test App](https://github.com/kurierjs/kurier/tree/main/tests/test-suite/test-app)** is the app used by tests, and is meant to be updated accordingly when we get more Spec-compliant, and treated more carefully.

Besides those, we've got a test suite that runs tests against each supported transport layer, and each database naming scheme.

All of the above can be run with commands in the scripts section of the `package.json` file

### Credentials
In order to contribute and test code in KurierJS, you might need some credentials, to get a valid token and authenticate your user. You could create new users, but with the aim of making things easier for users, you can use the following hardcoded credentials (bear in mind that this only work for the test apps, not for any real app):

For the **Dummy App**, you can use the following credentials:

```bash
curl --location --request POST 'localhost:3000/sessions' \
--header 'Content-Type: application/json' \
--data-raw '{
    "data": {
        "attributes": {
            "email": "joel@prototypal.io",
            "password": "n4t4n13l"
        },
        "type": "session",
        "relationships": {}
    }
}'
```

And for the **Test App**, you can use the following:

```bash
curl --location --request POST 'localhost:3000/sessions' \
--header 'Content-Type: application/json' \
--data-raw '{
    "data": {
        "attributes": {
            "email": "me@me.com",
            "password": "test"
        },
        "type": "session",
        "relationships": {}
    }
}'
```

You can then use the token in the headers of all the requests you make to the server like so:

```bash
curl --location --request GET 'localhost:3000/articles' \
--header 'Authorization: Bearer - THE_TOKEN_YOU_GOT_IN_THE_RESPONSE' \
--header 'Content-Type: application/json'
```

At some point we'll post a Postman Collection or something, with more examples and stuff, to make life easier for developers wanting to test things.

## Feedback

If you feel that something is missing from this document, that could make your life easier, let us know! Make an issue (or a Pull Request) and we'll check it out!.
