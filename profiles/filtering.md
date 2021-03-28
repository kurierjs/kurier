---
name: Filtering
short_description: |
  Rules for filtering data, as implemented by the Kurier framework.

extended_description: |
  This is the specification of [a profile](http://jsonapi.org/format/1.1/#profiles)
  for the JSON:API specification.

  The url for this profile is not yet defined.

  Data filtering is a way to require a specific subset of data from a data source,
  with several different ways to match and evaluate search criteria, similar to what
  database query languages offer in relational database engines. A valid analogy
  would be to compare this profile to what the `WHERE` clause looks like in SQL
  or similar languages.

  This technique alleviates the expense of sending large datasets from a server
  to a client and also reduces the processing time that a client would otherwise
  require to filter a large dataset.

  In order to support data filtering, this specification defines a series of
  comparers:

  - `eq` (equal)
  - `ne` (not equal)
  - `lt` (less than)
  - `gt` (greater than)
  - `le` (less or equal)
  - `ge` (greater or equal)
  - `like` (starts with, contains, ends with)
  - `nlike` (the negated form of `like`)
  - `in` (match against a series of values)
  - `nin` (not match against a series of values)

  For example, this request would get all the people who was born in Argentina:

  ```
  GET /people?filter[countryOfBirth]=AR
  ```

  Also, if working with JSON:API Operations, the same request would be like this:

  ```json
  {
    "op": "get",
    "ref": {
      "type": "person"
    },
    "params": {
      "filter": {
        "countryOfBirth": "AR"
      }
    }
  }
  ```

  Other combinations are possible, and these parameters are described in greater
  detail in the following sections.

minimum_jsonapi_version: 1.0
minimum_jsonapi_version_explanation: /
  While this profile is compatible with JSON:API Operations, its specification
  also conforms without breaking changes to the 1.0 version of the JSON:API
  specification.

discussion_url: https://github.com/kurierjs/kurier

editors:
  - name: Joel A. Villarreal Bertoldi
    email: joel.a.villarreal@gmail.com
  - name: Santiago Pérsico
    email: santiagopersico@gmail.com

categories:
  - Filtering
---

# Concepts

## Filtering requirements

The server implementing this profile **SHOULD** support filtering when
[fetching](https://jsonapi.org/format/1.0/#fetching-resources) resources.

The server implementing this profile **MAY** support filtering when
[updating](https://jsonapi.org/format/1.0/#crud-updating)
or [removing](https://jsonapi.org/format/1.0/#crud-deleting) resources.

## Comparer

A **comparer** is a kind of operator that defines how two values are compared
against each other.

When filtering resources, the result of the comparison will determine if a resource is
included as part of a response to a request with filtering constraints applied.

# Applying filters

The client **MAY** choose to apply filters on HTTP requests or [JSON:API operations](https://github.com/json-api/json-api/blob/999e6df77b28549d6c37b163b73c8e9102400020/_format/1.1/index.md#-operations).

## On HTTP requests

The client **MUST** use the [`filter` query parameter family](https://jsonapi.org/format/1.0/#fetching-filtering), following this format:

```
GET /{type}?filter[{attribute}]={comparer:}{value}
```

Where:

- `{type}` is a [resource type](https://jsonapi.org/format/1.0/#document-resource-object-identification),
  used to describe resource objects that share common attributes
  and relationships.
- `{attribute}` is the name of an [attribute](https://jsonapi.org/format/1.0/#document-resource-object-attributes),
  a representation of information about the resource object.
- `{comparer:}` is one of the [comparers](#comparers) defined in
  this profile, followed by a colon. If a comparer is not specified,
  the server **MUST** assume that is an equality (`eq`) comparison.
- `{value}` is the information which the comparer will use to match
  against the attribute's value.

## On JSON:API operations

The client **MUST** use the [`filter` attribute in the `params` object of an operation](https://github.com/json-api/json-api/blob/999e6df77b28549d6c37b163b73c8e9102400020/_format/1.1/index.md#-operation-objects),
following this format:

```json
{
  "op": "get",
  "ref": {
    "type": "{type}"
  },
  "params": {
    "filter": {
      "{attribute}": "{comparer:}{value}"
    }
  }
}
```

Where `{type}`, `{attribute}`, `{comparer:}` and `value` represent the same
concepts described in the HTTP request format.

# Comparers

## Exact match (`eq`, `ne`)

The equal (`eq`) and not-equal (`ne`) comparers are the most primitive
form of comparers, since they evaluate for an exact match (or not-match).

The server **MUST** implement this comparer for all value types.

**HTTP request**

```sh
# Do a GET HTTP request for people who were born in Argentina.
GET /people?filter[countryOfBirth]=AR

# Do a GET HTTP request for people who were *not* born in Argentina.
GET /people/filter[countryOfBirth]=ne:AR
```

**JSON:API operation**

```json
// Do a "get" operation for people who were born in Argentina.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "countryOfBirth": "AR"
    }
  }
}

// Do a "get" operation for people who were *not* born in Argentina.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "countryOfBirth": "ne:AR"
    }
  }
}
```

Note that for the equality examples, the `eq` comparer is not declared
as part of the request/operation. This is because `eq` is the default
comparer.

If a comparer is not specified, the server **MUST** assume that is an
equality (`eq`) comparison.

## Range comparison (`lt`, `gt`, `le`, `ge`)

The less-than (`lt`), greater-than (`gt`), less-or-equal (`le`) and
greater-or-equal (`ge`) comparers allow a client to request filtered
data by using a range comparison.

The server **SHOULD** implement this comparer for all applicable types
where a notion of _less-than_ or _greater-than_ apply (such as numbers
or timestamps).

**HTTP request**

```sh
# Do a GET HTTP request for people who were born before 1990.
GET /people?filter[yearOfBirth]=lt:1990

# Do a GET HTTP request for people who were born after 2000.
GET /people?filter[yearOfBirth]=gt:2000

# Do a GET HTTP request for people who were born on or before 1990.
GET /people/filter[yearOfBirth]=le:1990

# Do a GET HTTP request for people who were born on or after 2000.
GET /people/filter[yearOfBirth]=ge:2000
```

**JSON:API operation**

```json
// Do a "get" operation for people who were born before 1990.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "yearOfBirth": "lt:1990"
    }
  }
}

// Do a "get" operation for people who were born after 2000.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "yearOfBirth": "gt:2000"
    }
  }
}

// Do a "get" operation for people who were born on or before 1990.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "yearOfBirth": "le:1990"
    }
  }
}

// Do a "get" operation for people who were born on or after 2000.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "yearOfBirth": "ge:2000"
    }
  }
}
```

## Partial match (`like`)

The `like` comparer allows to partially match a given value against
the value of an attribute.

The server **SHOULD** implement this comparer for any value types that
contain text or string data.

This comparer makes use of the `%` symbol as a wild-card to determine
how it behaves:

- If `%` **precedes** the value to match, the comparer **MUST** match
  against any attribute value that **ends with** the provided value.
- If `%` **follows** the value to match, the comparer **MUST** match
  against any attribute value that **starts with** the provided value.
- If `%` **surrounds** the value to match, the comparer **MUST** match
  against any attribute value that **contains** the provided value.

**HTTP request**

```sh
# Do a GET HTTP request for people who contain the word
# "engineer" in their job title.
GET /people?filter[jobTitle]=like:%engineer%

# Do a GET HTTP request for people whose name starts with John.
GET /people?filter[firstName]=like:John%

# Do a GET HTTP request for people whose Social Security Number
# ends with 123.
GET /people/filter[ssn]=like:%123
```

**JSON:API operation**

```json
// Do a "get" operation for people who contain the word "engineer"
// in their job title.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "jobTitle": "like:%engineer%"
    }
  }
}

// Do a "get" operation for people whose name starts with John.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "firstName": "like:John%"
    }
  }
}

// Do a "get" operation for people whose Social Security Number
// ends with 123.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "ssn": "like:%123"
    }
  }
}
```

## Match against possible values (`in`, `nin`)

The `in` and not-in (`nin`) comparers are used to match an attribute
value against a list of possible values. It's an extension of the
equality and inequality comparers, since they match or not-match
exactly against a value.

The client **MUST** provide a list of possible values in a
comma-separated list when using either `in` or `nin`.

The server **MUST** implement this comparer for all value types.

**HTTP request**

```sh
# Do a GET HTTP request for people who are single or divorced.
GET /people?filter[maritalStatus]=in:single,divorced

# Do a GET HTTP request for people who are not married nor single.
GET /people?filter[maritalStatus]=nin:married,single
```

**JSON:API operation**

```json
// Do a "get" operation for people who are single or divorced.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "maritalStatus": "in:single,divorced"
    }
  }
}

// Do a "get" operation for people who are not married nor single.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "maritalStatus": "nin:married,single"
    }
  }
}
```

# Combining multiple filters

It is possible to apply multiple criteria to further restrict the
subset of data the server will send to the client.

The server **MUST** support applying multiple filter query parameters
to different attributes.

The server **MUST** support applying multiple comparers to a same attribute.

Note that all filters **MUST** be applied and evaluated as an `AND`-chain.
In order to a resource to be served, all criteria **MUST** be met.

**HTTP request**

```sh
# Do a GET HTTP request for people born in 1990 who are not married and
# have a job related to Engineering.
GET /people?filter[yearOfBirth]=1990&filter[maritalStatus]=ne:married&filter[jobTitle]=like:%engineer%

# Do a GET HTTP Request for people born between 1990 and 1995 who have
# not got a job a related to Engineering.
GET /people?filter[yearOfBirth]=ge:1990|le:1995&filter[jobTitle]=nlike:%engineer%
```

**JSON:API operation**

```json
// Do a "get" operation for people born in 1990 who are not married and
// have a job related to Engineering.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "yearOfBirth": "1990",
      "maritalStatus": "ne:married",
      "jobTitle": "like:%engineer%"
    }
  }
}

// Do a "get" operation for people born between 1990 and 1995 who have
// not got a job related to Engineering.
{
  "op": "get",
  "ref": {
    "type": "person"
  },
  "params": {
    "filter": {
      "yearOfBirth": "ge:1990|le:1995",
      "jobTitle": "nlike:%engineer%"
    }
  }
}
```
