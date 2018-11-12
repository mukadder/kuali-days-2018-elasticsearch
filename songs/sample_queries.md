## Retrieve all documents
```
POST songs/_search
{
  "query": {
    "match_all": {}
  }
}
```

## Full text search across all fields
```
POST songs/_search
{
  "query": {
    "multi_match": {
      "query": "*maiden*"
    }
  }
}
```

## Full text search across multiple fields with boosting
```
POST songs/_search
{
  "query": {
    "multi_match": {
      "query": "hop",
      "fields": [ "artist^3", "title^2", "tags" ]
    }
  }
}
```

## Specific term query
```
POST songs/_search
{
  "query": {
    "term": {
      "artist": "prince"
    }
  }
}
```

## Compound query
```
POST songs/_search
{
  "query": {
    "bool": {
      "must": {
        "term": {
          "tags": "rock"
        }
      },
      "must_not": {
        "terms": {
          "artist": [ "santana", "boston" ]
        }
      }
    }
  }
}
```

## Range query on numeric or date fields
```
POST songs/_search
{
  "query": {
    "range": {
      "timestamp": {
        "gte": "09/01/2011",
        "lte": "09/30/2011",
        "format": "MM/dd/yyyy"
      }
    }
  },
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ]
}
```

## Manipulating results and controlling score
```
POST songs/_search
{
  "_source": {
    "includes": [ "artist", "title" ],
    "excludes": [ "tags" ]
  },
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "title": "story"
          }
        },
        {
          "match": {
            "artist": {
              "query": "davis",
              "boost": 1.2
            }
          }
        }
      ],
      "filter": [
        {
          "nested": {
            "path": "tags",
            "query": {
              "term": {
                "tags.tag.raw": "jazz"
              }
            }
          }
        }
      ]
    }
  }
}
```
