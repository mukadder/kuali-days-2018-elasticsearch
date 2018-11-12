## Bucket aggregation on artist
```
POST songs/_search
{
  "aggs": {
    "top_artists": {
      "terms": {
        "field": "artist.raw"
      }
    }
  }
}
```

## Reverse-sorted bucket aggregation on artist
```
POST songs/_search
{
  "aggs": {
    "top_artists": {
      "terms": {
        "field": "artist.raw",
        "order": { "_count": "asc" }
      }
    }
  }
}
```

## Parent pipeline bucket aggregation on genre
```
POST songs/_search
{
  "aggs": {
    "genres": {
      "nested": {
        "path": "tags"
      },
      "aggs": {
        "top_genres": {
          "terms": {
            "field": "tags.tag.raw"
          }
        }
      }
    }
  }
}
```

## Sibling aggregation on artists' song count
```
POST songs/_search
{
  "aggs": {
    "artists": {
      "terms": {
        "field": "artist.raw"
      }
    },
    "avg_songs_per_artist": {
      "avg_bucket": {
        "buckets_path": "artists>_count"
      }
    }
  }
}
``
