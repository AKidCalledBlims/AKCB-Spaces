# AKCB Twitter Spaces

A simple NodeJS app to search Twitter Spaces with '#AKCB' in the title.

This runs every 5 minutes using a Node `cron` task, parses the search results and saves a JSON cache file. 
The JSON file must be web-accessible to be read by the main index.html in the parent folder.

A Twitter Developer account is required to obtain a Bearer Token to access the Spaces Search API.

- https://developer.twitter.com/en/docs/twitter-api/spaces/search/introduction
- Spaces search API Reference  https://developer.twitter.com/en/docs/twitter-api/spaces/search/api-reference/get-spaces-search


-----

@blims 