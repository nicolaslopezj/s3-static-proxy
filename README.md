# S3 Static Proxy

Add SEO to create react app's by using prerender.io.

This is a express app that connects to a S3 bucket and returns the index.html file,
and make the client fetch other files directly from S3.

# Instructions

- Fork this repo.

- Create a prerender.io account.

- Create a Heroku app pointing to your forked repo (there is no need for a special buildpack).

- Set environment variables.

```
BUCKET=[BUCKET]
ACCESS_KEY_ID=[ACCESS_KEY_ID]
SECRET_ACCESS_KEY=[SECRET_ACCESS_KEY]
PRERENDER_TOKEN=[PRERENDER_TOKEN]
```
