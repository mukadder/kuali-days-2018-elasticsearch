## Starting the Elasticsearch Docker cluster

To run the cluster in interactive mode:
```
docker-compose up
```

To run the cluster in the background:
```
docker-compose up -d
```

To view logs from an Elasticsearch cluster running in the background:
```
docker-compose logs -f
```

After startup has completed, the Elasticsearch cluster will be available at http://localhost:9200. You can also navigate to http://localhost:5601 to explore the cluster via the Kibana interface, and can use the Dev Tools tab to begin running queries.
