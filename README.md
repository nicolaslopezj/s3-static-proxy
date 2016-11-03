# S3 Static Proxy

Server side rendering solution for create react apps.

This is a express app that connects to a S3 bucket and returns the index.html file,
and make the client fetch other files directly from S3. If the requester is a scrapper it returns
rendered html code using prerender.io.

# Instructions

- Deploy to heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/nicolaslopezj/s3-static-proxy/tree/master)

- Create a prerender.io account.

- Set environment variables.

```
BUCKET=[BUCKET]
ACCESS_KEY_ID=[ACCESS_KEY_ID]
SECRET_ACCESS_KEY=[SECRET_ACCESS_KEY]
PRERENDER_TOKEN=[PRERENDER_TOKEN]
```

To deploy your apps you can use [react-deploy-s3](https://github.com/nicolaslopezj/react-deploy-s3)
